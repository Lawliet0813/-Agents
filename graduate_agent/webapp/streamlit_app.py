"""研究生專屬 AGENT - Streamlit Web UI"""
import streamlit as st
import json
import os
from pathlib import Path
from datetime import datetime
import sys

# 添加專案根目錄到路徑
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from graduate_agent.utils.config import ConfigManager, MoodleConfig, NotionConfig, Config
from graduate_agent.moodle.scraper import MoodleScraper
from graduate_agent.moodle.downloader import MoodleDownloader


# 頁面設定
st.set_page_config(
    page_title="研究生專屬 AGENT",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 初始化 session state
if 'config' not in st.session_state:
    st.session_state.config = None
if 'courses_data' not in st.session_state:
    st.session_state.courses_data = None
if 'scraper_running' not in st.session_state:
    st.session_state.scraper_running = False


def load_config_from_env():
    """從環境變數載入配置"""
    username = os.getenv('MOODLE_USERNAME', '')
    password = os.getenv('MOODLE_PASSWORD', '')
    notion_token = os.getenv('NOTION_TOKEN', '')

    return {
        'base_url': 'https://moodle45.nccu.edu.tw',
        'username': username,
        'password': password,
        'download_dir': 'graduate_agent/data/downloads',
        'headless': True,
        'notion_token': notion_token
    }


def save_config(config_dict):
    """儲存配置到 session state"""
    moodle_config = MoodleConfig(
        base_url=config_dict['base_url'],
        username=config_dict['username'],
        password=config_dict['password'],
        download_dir=config_dict['download_dir'],
        headless=config_dict.get('headless', True)
    )

    notion_config = None
    if config_dict.get('notion_token'):
        notion_config = NotionConfig(token=config_dict['notion_token'])

    st.session_state.config = Config(moodle=moodle_config, notion=notion_config)


def sidebar():
    """側邊欄導航"""
    st.sidebar.title("🎓 研究生專屬 AGENT")
    st.sidebar.markdown("---")

    page = st.sidebar.radio(
        "功能選單",
        ["🏠 首頁", "⚙️ 設定", "📚 爬取課程", "📥 下載資源", "🔄 Notion 同步", "📊 狀態查看"],
        index=0
    )

    st.sidebar.markdown("---")
    st.sidebar.markdown("### 📌 快速資訊")

    if st.session_state.config:
        st.sidebar.success("✓ 配置已設定")
    else:
        st.sidebar.warning("⚠ 尚未設定配置")

    if st.session_state.courses_data:
        course_count = len(st.session_state.courses_data.get('courses', []))
        st.sidebar.info(f"📚 已載入 {course_count} 門課程")

    st.sidebar.markdown("---")
    st.sidebar.markdown("""
    ### 📖 使用說明
    1. 先到「設定」頁面配置帳號
    2. 使用「爬取課程」獲取資料
    3. 選擇「下載資源」下載檔案
    4. （可選）同步到 Notion
    """)

    return page


def home_page():
    """首頁"""
    st.title("🎓 研究生專屬 AGENT")
    st.markdown("### 自動化你的 Moodle 課程管理")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.info("""
        ### 📚 課程爬取
        自動登入 Moodle 並獲取所有課程的結構化資料
        """)

    with col2:
        st.success("""
        ### 📥 資源下載
        自動下載課程資料並按週次組織
        """)

    with col3:
        st.warning("""
        ### 🔄 Notion 同步
        將課程資料同步到 Notion 工作區
        """)

    st.markdown("---")

    # 系統狀態
    st.subheader("📊 系統狀態")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        if st.session_state.config:
            st.metric("配置狀態", "✓ 已設定", delta="正常")
        else:
            st.metric("配置狀態", "✗ 未設定", delta="需要設定")

    with col2:
        if st.session_state.courses_data:
            course_count = len(st.session_state.courses_data.get('courses', []))
            st.metric("課程數量", course_count, delta=f"{course_count} 門")
        else:
            st.metric("課程數量", 0, delta="尚未爬取")

    with col3:
        download_dir = Path("graduate_agent/data/downloads")
        if download_dir.exists():
            file_count = sum(1 for _ in download_dir.rglob('*') if _.is_file())
            st.metric("下載檔案", file_count, delta=f"{file_count} 個")
        else:
            st.metric("下載檔案", 0, delta="無")

    with col4:
        json_file = Path("moodle_courses.json")
        if json_file.exists():
            mtime = datetime.fromtimestamp(json_file.stat().st_mtime)
            st.metric("最後更新", mtime.strftime("%m/%d %H:%M"))
        else:
            st.metric("最後更新", "從未", delta="N/A")

    st.markdown("---")

    # 快速開始
    st.subheader("🚀 快速開始")

    if not st.session_state.config:
        st.warning("請先到「⚙️ 設定」頁面配置您的 Moodle 帳號")
    else:
        st.success("✓ 配置完成！您可以開始使用各項功能")

        col1, col2, col3 = st.columns(3)
        with col1:
            if st.button("📚 立即爬取課程", use_container_width=True):
                st.info("請前往「📚 爬取課程」頁面")
        with col2:
            if st.button("📥 下載資源", use_container_width=True):
                st.info("請前往「📥 下載資源」頁面")
        with col3:
            if st.button("🔄 同步 Notion", use_container_width=True):
                st.info("請前往「🔄 Notion 同步」頁面")


def settings_page():
    """設定頁面"""
    st.title("⚙️ 系統設定")

    # 載入現有配置或環境變數
    default_config = load_config_from_env()

    st.markdown("### 🔐 Moodle 帳號設定")

    col1, col2 = st.columns(2)

    with col1:
        base_url = st.text_input(
            "Moodle URL",
            value=default_config.get('base_url', 'https://moodle45.nccu.edu.tw'),
            help="Moodle 網站的基礎 URL"
        )

        username = st.text_input(
            "學號",
            value=default_config.get('username', ''),
            help="您的 Moodle 登入帳號"
        )

    with col2:
        download_dir = st.text_input(
            "下載目錄",
            value=default_config.get('download_dir', 'graduate_agent/data/downloads'),
            help="課程資源的下載位置"
        )

        password = st.text_input(
            "密碼",
            value=default_config.get('password', ''),
            type="password",
            help="您的 Moodle 登入密碼"
        )

    headless = st.checkbox(
        "無頭模式（不顯示瀏覽器視窗）",
        value=default_config.get('headless', True),
        help="勾選後瀏覽器將在背景執行"
    )

    st.markdown("---")
    st.markdown("### 🔗 Notion 整合（可選）")

    notion_token = st.text_input(
        "Notion Integration Token",
        value=default_config.get('notion_token', ''),
        type="password",
        help="從 https://www.notion.so/my-integrations 獲取"
    )

    st.markdown("---")

    col1, col2, col3 = st.columns([1, 1, 2])

    with col1:
        if st.button("💾 儲存設定", use_container_width=True, type="primary"):
            if not username or not password:
                st.error("請填寫學號和密碼")
            else:
                config_dict = {
                    'base_url': base_url,
                    'username': username,
                    'password': password,
                    'download_dir': download_dir,
                    'headless': headless,
                    'notion_token': notion_token
                }
                save_config(config_dict)
                st.success("✓ 設定已儲存！")
                st.balloons()

    with col2:
        if st.button("🔄 從環境變數載入", use_container_width=True):
            st.rerun()

    # 安全提示
    st.markdown("---")
    st.info("""
    ### 🔒 安全提示
    - 建議使用環境變數（`.env` 檔案）儲存密碼
    - 此設定僅保存在本次 session 中
    - 重新整理頁面後需要重新設定
    """)


def scrape_page():
    """爬取課程頁面"""
    st.title("📚 爬取課程資料")

    if not st.session_state.config:
        st.error("⚠️ 請先到「設定」頁面配置您的 Moodle 帳號")
        return

    st.markdown("### 📋 爬取設定")

    col1, col2 = st.columns([2, 1])

    with col1:
        st.info(f"**Moodle URL**: {st.session_state.config.moodle.base_url}")
        st.info(f"**帳號**: {st.session_state.config.moodle.username}")

    with col2:
        output_file = st.text_input(
            "輸出檔案",
            value="moodle_courses.json",
            help="爬取結果的儲存位置"
        )

    st.markdown("---")

    # 開始爬取按鈕
    if st.button("🚀 開始爬取", use_container_width=True, type="primary"):
        with st.spinner("正在登入 Moodle..."):
            try:
                # 創建進度容器
                progress_bar = st.progress(0)
                status_text = st.empty()

                # 創建爬蟲
                with MoodleScraper(
                    base_url=st.session_state.config.moodle.base_url,
                    username=st.session_state.config.moodle.username,
                    password=st.session_state.config.moodle.password,
                    headless=st.session_state.config.moodle.headless
                ) as scraper:
                    # 登入
                    status_text.text("正在登入...")
                    progress_bar.progress(20)

                    if not scraper.login():
                        st.error("❌ 登入失敗，請檢查帳號密碼")
                        return

                    st.success("✓ 登入成功")

                    # 獲取課程
                    status_text.text("正在獲取課程列表...")
                    progress_bar.progress(40)

                    courses = scraper.get_courses()
                    st.info(f"✓ 找到 {len(courses)} 門課程")

                    # 解析課程內容
                    status_text.text("正在解析課程內容...")

                    for idx, course in enumerate(courses):
                        progress = 40 + int((idx + 1) / len(courses) * 50)
                        progress_bar.progress(progress)
                        status_text.text(f"正在解析: {course['name']}")

                        scraper.get_course_content(course)

                    # 儲存資料
                    status_text.text("正在儲存資料...")
                    progress_bar.progress(95)

                    data = {
                        'timestamp': datetime.now().isoformat(),
                        'base_url': st.session_state.config.moodle.base_url,
                        'username': st.session_state.config.moodle.username,
                        'courses': courses
                    }

                    scraper.save_to_json(data, output_file)
                    st.session_state.courses_data = data

                    progress_bar.progress(100)
                    status_text.text("✓ 完成！")

                st.success(f"✅ 成功爬取 {len(courses)} 門課程！")
                st.balloons()

            except Exception as e:
                st.error(f"❌ 爬取失敗: {str(e)}")
                import traceback
                with st.expander("查看詳細錯誤"):
                    st.code(traceback.format_exc())

    st.markdown("---")

    # 顯示已爬取的課程
    if st.session_state.courses_data:
        st.subheader("📊 已爬取的課程")

        courses = st.session_state.courses_data.get('courses', [])

        for course in courses:
            with st.expander(f"📚 {course['name']}"):
                st.write(f"**課程 ID**: {course.get('id', 'N/A')}")
                st.write(f"**課程連結**: {course.get('url', 'N/A')}")
                st.write(f"**章節數**: {len(course.get('sections', []))}")

                # 統計資源數量
                total_activities = sum(
                    len(section.get('activities', []))
                    for section in course.get('sections', [])
                )
                st.write(f"**活動/資源數**: {total_activities}")

                # 顯示章節
                if st.checkbox(f"顯示 {course['name']} 的詳細章節", key=f"detail_{course['id']}"):
                    for section in course.get('sections', []):
                        st.markdown(f"**{section.get('title', 'Unknown')}**")
                        for activity in section.get('activities', []):
                            st.markdown(f"- {activity.get('type', '?')} : {activity.get('name', 'Unknown')}")
    else:
        # 嘗試從檔案載入
        json_file = Path("moodle_courses.json")
        if json_file.exists():
            if st.button("📂 從檔案載入課程資料"):
                with open(json_file, 'r', encoding='utf-8') as f:
                    st.session_state.courses_data = json.load(f)
                st.success("✓ 已從檔案載入課程資料")
                st.rerun()


def download_page():
    """下載資源頁面"""
    st.title("📥 下載課程資源")

    if not st.session_state.config:
        st.error("⚠️ 請先到「設定」頁面配置您的 Moodle 帳號")
        return

    if not st.session_state.courses_data:
        st.warning("⚠️ 請先爬取課程資料")
        if st.button("前往爬取頁面"):
            st.info("請使用左側選單切換到「📚 爬取課程」")
        return

    courses = st.session_state.courses_data.get('courses', [])

    st.markdown("### 📋 下載設定")

    # 選擇要下載的課程
    course_names = [course['name'] for course in courses]
    selected_courses = st.multiselect(
        "選擇要下載的課程",
        options=course_names,
        default=course_names,
        help="可以選擇一門或多門課程"
    )

    col1, col2 = st.columns(2)

    with col1:
        skip_existing = st.checkbox(
            "跳過已存在的檔案",
            value=True,
            help="勾選後不會重複下載已存在的檔案"
        )

    with col2:
        download_dir = st.text_input(
            "下載目錄",
            value=st.session_state.config.moodle.download_dir,
            help="檔案將儲存在此目錄"
        )

    st.markdown("---")

    # 開始下載按鈕
    if st.button("📥 開始下載", use_container_width=True, type="primary"):
        if not selected_courses:
            st.warning("請至少選擇一門課程")
            return

        try:
            # 篩選選中的課程
            selected_course_data = [
                course for course in courses
                if course['name'] in selected_courses
            ]

            # 創建爬蟲（需要登入狀態才能下載）
            with st.spinner("正在登入 Moodle..."):
                with MoodleScraper(
                    base_url=st.session_state.config.moodle.base_url,
                    username=st.session_state.config.moodle.username,
                    password=st.session_state.config.moodle.password,
                    headless=st.session_state.config.moodle.headless
                ) as scraper:
                    if not scraper.login():
                        st.error("❌ 登入失敗")
                        return

                    st.success("✓ 登入成功")

                    # 創建下載器
                    downloader = MoodleDownloader(scraper.driver, download_dir)

                    # 下載每門課程
                    for course_data in selected_course_data:
                        st.markdown(f"### 📚 {course_data['name']}")

                        with st.expander("下載進度", expanded=True):
                            progress_container = st.container()

                            with progress_container:
                                stats = downloader.download_course(
                                    course_data,
                                    skip_existing=skip_existing
                                )

                                # 顯示統計
                                col1, col2, col3, col4 = st.columns(4)
                                with col1:
                                    st.metric("總計", stats['total'])
                                with col2:
                                    st.metric("已下載", stats['downloaded'])
                                with col3:
                                    st.metric("已跳過", stats['skipped'])
                                with col4:
                                    st.metric("失敗", stats['failed'])

                    st.success("✅ 所有課程下載完成！")
                    st.balloons()

        except Exception as e:
            st.error(f"❌ 下載失敗: {str(e)}")
            import traceback
            with st.expander("查看詳細錯誤"):
                st.code(traceback.format_exc())

    st.markdown("---")

    # 顯示下載目錄統計
    st.subheader("📊 下載統計")

    download_path = Path(download_dir)
    if download_path.exists():
        # 統計各課程的檔案數量
        course_folders = [f for f in download_path.iterdir() if f.is_dir()]

        for folder in course_folders:
            file_count = sum(1 for _ in folder.rglob('*') if _.is_file())
            st.info(f"📁 **{folder.name}**: {file_count} 個檔案")
    else:
        st.warning("下載目錄尚不存在")


def notion_sync_page():
    """Notion 同步頁面"""
    st.title("🔄 Notion 同步")

    if not st.session_state.config or not st.session_state.config.notion:
        st.error("⚠️ 請先到「設定」頁面配置 Notion Token")
        return

    if not st.session_state.courses_data:
        st.warning("⚠️ 請先爬取課程資料")
        return

    st.markdown("### 🔗 Notion 設定")

    parent_page_id = st.text_input(
        "Notion 父頁面 ID",
        help="在 Notion 中創建一個頁面，並從 URL 中複製頁面 ID"
    )

    st.info("""
    **如何獲取 Notion 頁面 ID？**
    1. 在 Notion 中打開目標頁面
    2. 從 URL 中複製 ID：`https://notion.so/My-Page-<這段是頁面ID>`
    3. 記得要將頁面分享給你的 Integration
    """)

    st.markdown("---")

    if st.button("🔄 開始同步", use_container_width=True, type="primary"):
        if not parent_page_id:
            st.warning("請填寫 Notion 父頁面 ID")
            return

        try:
            from graduate_agent.notion.client import NotionClient
            from graduate_agent.notion.sync import NotionSync

            with st.spinner("正在連接 Notion..."):
                # 創建 Notion 客戶端
                notion_client = NotionClient(st.session_state.config.notion.token)

                # 創建或獲取資料庫
                sync = NotionSync(notion_client)
                database_id = sync.get_or_create_courses_database(parent_page_id)

                st.success(f"✓ 資料庫已準備：{database_id}")

                # 同步課程
                courses = st.session_state.courses_data.get('courses', [])

                progress_bar = st.progress(0)
                status_text = st.empty()

                for idx, course in enumerate(courses):
                    progress = int((idx + 1) / len(courses) * 100)
                    progress_bar.progress(progress)
                    status_text.text(f"正在同步: {course['name']}")

                    sync.sync_course(course)

                st.success(f"✅ 成功同步 {len(courses)} 門課程到 Notion！")
                st.balloons()

        except Exception as e:
            st.error(f"❌ 同步失敗: {str(e)}")
            import traceback
            with st.expander("查看詳細錯誤"):
                st.code(traceback.format_exc())


def status_page():
    """狀態查看頁面"""
    st.title("📊 系統狀態")

    # 配置狀態
    st.subheader("⚙️ 配置狀態")
    if st.session_state.config:
        st.success("✓ 配置已設定")

        col1, col2 = st.columns(2)
        with col1:
            st.info(f"**Moodle URL**: {st.session_state.config.moodle.base_url}")
            st.info(f"**帳號**: {st.session_state.config.moodle.username}")
            st.info(f"**下載目錄**: {st.session_state.config.moodle.download_dir}")
        with col2:
            st.info(f"**無頭模式**: {'是' if st.session_state.config.moodle.headless else '否'}")
            notion_status = "✓ 已設定" if st.session_state.config.notion else "✗ 未設定"
            st.info(f"**Notion**: {notion_status}")
    else:
        st.warning("⚠️ 尚未設定配置")

    st.markdown("---")

    # 課程資料狀態
    st.subheader("📚 課程資料")
    if st.session_state.courses_data:
        courses = st.session_state.courses_data.get('courses', [])
        st.success(f"✓ 已載入 {len(courses)} 門課程")

        # 顯示課程列表
        for course in courses:
            section_count = len(course.get('sections', []))
            activity_count = sum(
                len(section.get('activities', []))
                for section in course.get('sections', [])
            )
            st.info(f"📚 **{course['name']}** - {section_count} 章節, {activity_count} 活動")
    else:
        st.warning("⚠️ 尚未載入課程資料")

        # 檢查檔案是否存在
        json_file = Path("moodle_courses.json")
        if json_file.exists():
            st.info("💡 發現 moodle_courses.json 檔案，可在「📚 爬取課程」頁面載入")

    st.markdown("---")

    # 檔案系統狀態
    st.subheader("📁 檔案系統")

    download_dir = Path("graduate_agent/data/downloads")
    if download_dir.exists():
        course_folders = [f for f in download_dir.iterdir() if f.is_dir()]
        total_files = sum(1 for _ in download_dir.rglob('*') if _.is_file())

        st.success(f"✓ 下載目錄存在")
        st.info(f"📊 課程資料夾: {len(course_folders)}")
        st.info(f"📊 總檔案數: {total_files}")

        # 顯示各課程統計
        if course_folders:
            st.markdown("#### 各課程統計")
            for folder in sorted(course_folders):
                file_count = sum(1 for _ in folder.rglob('*') if _.is_file())
                folder_size = sum(
                    f.stat().st_size for f in folder.rglob('*') if f.is_file()
                ) / (1024 * 1024)  # MB
                st.info(f"📁 **{folder.name}**: {file_count} 檔案, {folder_size:.2f} MB")
    else:
        st.warning("⚠️ 下載目錄尚不存在")

    st.markdown("---")

    # JSON 檔案狀態
    st.subheader("📄 資料檔案")
    json_file = Path("moodle_courses.json")
    if json_file.exists():
        size = json_file.stat().st_size / 1024  # KB
        mtime = datetime.fromtimestamp(json_file.stat().st_mtime)

        st.success("✓ moodle_courses.json 存在")
        st.info(f"📊 檔案大小: {size:.2f} KB")
        st.info(f"📊 最後修改: {mtime.strftime('%Y-%m-%d %H:%M:%S')}")

        if st.button("👁️ 查看 JSON 內容"):
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            with st.expander("JSON 內容", expanded=True):
                st.json(data)
    else:
        st.warning("⚠️ moodle_courses.json 不存在")


# 主程式
def main():
    # 側邊欄
    page = sidebar()

    # 根據選擇顯示對應頁面
    if page == "🏠 首頁":
        home_page()
    elif page == "⚙️ 設定":
        settings_page()
    elif page == "📚 爬取課程":
        scrape_page()
    elif page == "📥 下載資源":
        download_page()
    elif page == "🔄 Notion 同步":
        notion_sync_page()
    elif page == "📊 狀態查看":
        status_page()


if __name__ == "__main__":
    main()
