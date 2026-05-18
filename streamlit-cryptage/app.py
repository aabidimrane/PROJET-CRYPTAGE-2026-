import streamlit as st
from auth import authenticate, is_admin, list_users, update_user_level, ACCESS_LEVELS
from crypto import encrypt_file, decrypt_file, access_level_description


def set_page_style() -> None:
    st.set_page_config(
        page_title="CIEL Cryptage",
        page_icon="🌌",
        layout="wide",
    )
    st.markdown(
        """
        <style>
        .stApp {
            background: radial-gradient(circle at top, #0b224b, #030613 20%, #000000 100%);
            color: #f8fafc;
        }
        .main {
            background: rgba(5, 16, 44, 0.83);
            border-radius: 24px;
            padding: 2rem 2rem 3rem 2rem;
            box-shadow: 0 0 80px rgba(10, 20, 60, 0.55);
        }
        .stButton>button {
            background-color: #6366f1;
            color: white;
            border-radius: 999px;
            height: 3rem;
        }
        .stDownloadButton>button {
            background-color: #10b981;
            color: white;
        }
        .stTextInput>div>div>input, .stTextArea>div>div>textarea {
            background: rgba(255, 255, 255, 0.08);
            color: white;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def initialize_session() -> None:
    if "page" not in st.session_state:
        st.session_state.page = "landing"
    if "user" not in st.session_state:
        st.session_state.user = None
    if "access_level" not in st.session_state:
        st.session_state.access_level = None


def landing_page() -> None:
    st.markdown("# Bienvenue dans CIEL Cryptage")
    st.markdown(
        "### Une expérience immersive pour protéger vos fichiers dans le ciel étoilé."
    )
    st.markdown(
        "<div style='padding: 1rem; border-radius: 20px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12)'>"
        "<p style='font-size:1rem; line-height: 1.8;'>"
        "Sécurisez vos documents grâce à un chiffrement adapté à votre niveau : vert, orange ou rouge. "
        "L‘admin peut gérer les accès et protéger l’environnement interne de l’entreprise.</p></div>",
        unsafe_allow_html=True,
    )
    if st.button("Commencer"):
        st.session_state.page = "login"


def login_page() -> None:
    st.markdown("## Authentification")
    username = st.text_input("Nom d'utilisateur")
    password = st.text_input("Mot de passe", type="password")
    if st.button("Se connecter"):
        user = authenticate(username.strip(), password.strip())
        if user:
            st.session_state.user = user
            st.session_state.access_level = user["level"]
            st.session_state.page = "dashboard"
            st.success(f"Bienvenue {username}, niveau {user['level'].upper()} activé.")
        else:
            st.error("Identifiants invalides. Essayez admin/admin ou alice/alice ou bob/bob.")


def sidebar_menu() -> str:
    st.sidebar.title("Navigation")
    st.sidebar.markdown("**Utilisateur :** " + st.session_state.user["username"])
    st.sidebar.markdown("**Role :** " + st.session_state.user["role"].capitalize())
    st.sidebar.markdown("**Niveau :** " + st.session_state.access_level.capitalize())
    page = st.sidebar.radio("Aller à", ["Dashboard"] + (["Administration"] if is_admin(st.session_state.user) else []))
    if st.sidebar.button("Déconnexion"):
        st.session_state.user = None
        st.session_state.page = "login"
        st.session_state.access_level = None
    return page


def dashboard_page() -> None:
    st.markdown("## Tableau de bord")
    st.info(access_level_description(st.session_state.access_level))
    mode = st.radio("Action", ["Chiffrer", "Déchiffrer"], horizontal=True)

    uploaded_file = st.file_uploader("Sélectionnez un fichier", type=None)
    password = st.text_input("Mot de passe de chiffrement", type="password")

    if uploaded_file and password:
        data = uploaded_file.read()
        file_name = uploaded_file.name

        if mode == "Chiffrer":
            if st.button("Lancer le chiffrement"):
                output_bytes = encrypt_file(data, password, st.session_state.access_level)
                output_name = f"{file_name}.ciel"
                st.success("Fichier chiffré avec succès.")
                st.download_button("Télécharger le fichier chiffré", data=output_bytes, file_name=output_name, mime="application/octet-stream")
        else:
            if st.button("Lancer le déchiffrement"):
                try:
                    output_bytes = decrypt_file(data, password)
                    output_name = file_name.replace(".ciel", "") or "dechiffre.bin"
                    st.success("Fichier déchiffré avec succès.")
                    st.download_button("Télécharger le fichier déchiffré", data=output_bytes, file_name=output_name, mime="application/octet-stream")
                except Exception:
                    st.error("Échec du déchiffrement. Vérifiez le mot de passe et le niveau de sécurité.")
    else:
        st.warning("Importez un fichier et renseignez un mot de passe pour activer le traitement.")


def administration_page() -> None:
    st.markdown("## Administration des accès")
    users = list_users()
    st.write("### Utilisateurs existants")
    st.table([{"Utilisateur": u, "Rôle": info["role"], "Niveau": info["level"]} for u, info in users.items()])

    st.markdown("---")
    st.write("### Modifier le niveau d'accès")
    selected_user = st.selectbox("Choisir un utilisateur", list(users.keys()))
    selected_level = st.selectbox("Nouveau niveau", ACCESS_LEVELS, index=ACCESS_LEVELS.index(users[selected_user]["level"]))
    if st.button("Mettre à jour le niveau"):
        if update_user_level(selected_user, selected_level):
            st.success(f"Niveau de {selected_user} mis à jour en {selected_level}.")
            st.session_state.access_level = selected_level if selected_user == st.session_state.user["username"] else st.session_state.access_level
        else:
            st.error("Impossible de mettre à jour le niveau.")


def main() -> None:
    set_page_style()
    initialize_session()

    if st.session_state.page == "landing":
        landing_page()
        return

    if st.session_state.page == "login" or st.session_state.user is None:
        login_page()
        return

    active_page = sidebar_menu()
    if active_page == "Dashboard":
        dashboard_page()
    elif active_page == "Administration":
        administration_page()


if __name__ == "__main__":
    main()
