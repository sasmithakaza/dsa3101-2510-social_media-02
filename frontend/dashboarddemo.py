import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

# Load environment variables from .env file
load_dotenv()

st.set_page_config(
    page_title="Dashboard Analytics",
    page_icon="📊",
    layout="wide"
)

# Global variable for time range
days_back = 30


def count_to_time_display(post_count):
    """Convert post count to time display (assumes 2 posts = 1 minute)"""
    total_minutes = post_count * 2  
    hours = total_minutes // 60
    minutes = total_minutes % 60
    return f"{hours}h {minutes}m"


# Connecting dashboard to database
@st.cache_resource(ttl=300)
def get_db_connection():
    """Create SQLAlchemy engine for pandas compatibility"""
    try:
        engine_str = f"mysql+pymysql://{os.getenv('DB_USER', 'root')}:{os.getenv('DB_PASSWORD', 'root')}@{os.getenv('DB_HOST', 'database')}:{os.getenv('DB_PORT', '3306')}/{os.getenv('DB_NAME', 'mydatabase')}"
        engine = create_engine(engine_str)
        
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        return engine
    except Exception as e:
        st.error(f"Database connection failed: {e}")
        return None

# Political spectrum data
@st.cache_data(ttl=60)
def get_political_spectrum_data():
    engine = get_db_connection()
    if engine is None:
        return None
    
    try:
        query = """
        SELECT 
            bias_label,
            COUNT(*) as post_count,
            COUNT(DISTINCT user_id) as unique_users
        FROM user_activity 
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL %s DAY)
        GROUP BY bias_label
        ORDER BY post_count DESC
        """
        
        df = pd.read_sql(query, engine, params=(days_back,))
        return df
    except Exception as e:
        st.error(f"Error fetching political data: {e}")
        return None

# Top subreddit data           
@st.cache_data(ttl=60)
def get_top_categories_data():
    engine = get_db_connection()
    if engine is None:
        return None
    
    try:
        query = """
        SELECT 
            subreddit,
            COUNT(*) as post_count,
            AVG(LENGTH(title)) as avg_title_length
        FROM user_activity 
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY subreddit
        ORDER BY post_count DESC
        LIMIT 5
        """
        
        df = pd.read_sql(query, engine)
        return df
    except Exception as e:
        st.error(f"Error fetching categories data: {e}")
        return None

# Static screentime data
def get_static_screentime_data():
    return {
        'modes': ['Skeptical Mode', 'Vibes Mode'],
        'hours': [4.22, 6.5],
        'time_display': ['4h 13m', '6h 30m'],
        'total_display': '10h 43m'
    }

# Enhanced CSS for Reddit integration - COMPLETELY REMOVES TOP WHITE BAR
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    }
    
    /* COMPLETELY REMOVE ALL STREAMLIT HEADERS AND TOP SPACING */
    .main {
        background-color: #f8fafc !important;
    }
    .stApp {
        background-color: #f8fafc !important;
    }
    
    /* REMOVE ALL DEFAULT STREAMLIT SPACING AND HEADERS */
    .block-container {
        padding-top: 0rem !important;
        padding-bottom: 0rem !important;
        max-width: 100% !important;
    }
    
    /* HIDE ALL STREAMLIT HEADERS AND FOOTERS */
    header {
        display: none !important;
    }
    footer {
        display: none !important;
    }
    .stApp > header {
        display: none !important;
    }
    
    /* HIDE STREAMLIT MENU AND HAMBURGER */
    #MainMenu {
        visibility: hidden !important;
    }
    .stDeployButton {
        display: none !important;
    }
    
    /* Reddit-style top bar */
    .reddit-topbar {
        background: white;
        border-bottom: 1px solid #e5e7eb;
        padding: 0.5rem 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: sticky;
        top: 0;
        z-index: 1000;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .reddit-left {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .reddit-logo {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 700;
        font-size: 1.25rem;
        color: #ff4500;
    }
    
    .reddit-logo svg {
        width: 24px;
        height: 24px;
    }
    
    .echo-break-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #111827;
        display: flex;
        align-items: center;
    }
    
    .reddit-icons {
        display: flex;
        align-items: center;
        gap: 1rem;
        color: #6b7280;
    }
    
    .reddit-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #ff4500;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
    }
    
    .main-header {
        font-size: 2rem;
        font-weight: 700;
        color: #111827;
        text-align: center;
        margin-bottom: 2rem;
        letter-spacing: -0.025em;
        margin-top: 1rem;
    }
    

    .card-header {
        font-size: 1.1rem;
        font-weight: 600;
        color: #111827;
        margin-bottom: 1rem;
        text-align: center;
        letter-spacing: -0.01em;
        padding: 0.5rem 0;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        transform: translateY(-2px);
    }
    
    /* Custom column spacing */
    [data-testid="column"] {
        gap: 1.5rem;
    }
    
    /* Chart container styling */
    .stPlotlyChart {
        border-radius: 12px;
        overflow: hidden;
    }
    
    /* Remove any residual margins */
    .stApp > div {
        margin: 0 !important;
        padding: 0 !important;
    }
    
    /* Add spacing between sections */
    .spaced-section {
        margin-top: 2rem;
    }
    
    /* Chart wrapper for better styling */
    .chart-wrapper {
        background: white;
        border-radius: 12px;
        padding: 0.5rem;
    }
</style>
""", unsafe_allow_html=True)

# Reddit Header
st.markdown("""
<div class="reddit-topbar">
    <div class="reddit-left">
        <div class="reddit-logo">
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0A12 12 0 1 0 12 24 12 12 0 1 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z"/>
            </svg>
            reddit
        </div>
    </div>
    <div class="echo-break-title">
        Echo Break
    </div>
    <div class="reddit-icons">
        <span>💬</span>
        <span>➕</span>
        <span>🔔</span>
        <div class="reddit-avatar">U</div>
    </div>
</div>
""", unsafe_allow_html=True)

st.markdown('<div class="spaced-section"></div>', unsafe_allow_html=True)

# Create 3 columns for the cards
col1, col2, col3 = st.columns(3, gap="medium")

with col1:
    # Political Spectrum Card
    st.markdown('<div class="card-header">Political Spectrum Distribution</div>', unsafe_allow_html=True)
    
    # Get live data from user_activity table
    political_data = get_political_spectrum_data()
    
    if political_data is not None and not political_data.empty:
        spectrum = []
        post_counts = []
        time_displays = []
        
        for _, row in political_data.iterrows():
            spectrum.append(row['bias_label'].title())
            post_counts.append(row['post_count'])
            time_displays.append(count_to_time_display(row['post_count']))
        
        if not spectrum:
            spectrum = ['Left', 'Right', 'Neutral']
            post_counts = [42, 65, 20]  
            time_displays = ['1h 24m', '2h 10m', '0h 40m']
    else:
        spectrum = ['Left', 'Right', 'Neutral']
        post_counts = [42, 65, 20]  
        time_displays = ['1h 24m', '2h 10m', '0h 40m']
    
    # Pie chart for political spectrum
    fig_spectrum = go.Figure(data=[go.Pie(
        labels=spectrum,
        values=post_counts,
        textinfo='percent+label',
        textposition='inside',
        hovertemplate='<b>%{label}</b><br>Posts: %{value}<br>%{customdata}<extra></extra>',
        customdata=time_displays,
        marker=dict(
            colors=['#e80c25', '#2F66B2', '#696969'],
            line=dict(color='white', width=2)
        ),
        hole=0.4
    )])
    
    fig_spectrum.update_layout(
        height=300,
        showlegend=False,
        margin=dict(l=20, r=20, t=20, b=20),
        font=dict(family='Inter, sans-serif', size=11),
        paper_bgcolor='white',
        plot_bgcolor='white'
    )
    
    st.plotly_chart(fig_spectrum, use_container_width=True, key="political_spectrum_pie")
    st.markdown('<div class="card-header"></div>', unsafe_allow_html=True)

with col2:
    # Screentime Analysis Card
    st.markdown('<div class="card-header">Screentime Analysis</div>', unsafe_allow_html=True)
    
    # Mode Breakdown Donut Chart
    modes = ['Skeptical', 'Vibes']
    hours = [4.22, 6.5]
    time_display = ['4h 13m', '6h 30m']  # Formatted display
    
    fig_modes = go.Figure(data=[go.Pie(
        labels=modes,
        values=hours,
        textinfo='label+value',  # Show label + actual hours value
        texttemplate='%{label}<br>%{value:.1f}h',  # Custom format: label + hours
        textposition='inside',
        hovertemplate='<b>%{label}</b><br>Time: %{customdata}<extra></extra>',
        customdata=time_display,
        marker=dict(
            colors=['#4CAF50', '#dc3545'], 
            line=dict(color='white', width=2)
        ),
        hole=0.5,
        textfont=dict(size=11, family='Inter')
    )])
    
    fig_modes.update_layout(
        height=300,
        showlegend=False,
        margin=dict(l=20, r=20, t=20, b=20),
        font=dict(family='Inter, sans-serif', size=11),
        paper_bgcolor='white',
        plot_bgcolor='white',
        annotations=[
            dict(
                text='10h 43m',
                x=0.5, y=0.5,
                font=dict(size=20, color='#111827', family='Inter', weight=700),
                showarrow=False
            ),
            dict(
                text='Total Screentime',
                x=0.5, y=0.42,
                font=dict(size=12, color='#6b7280', family='Inter', weight=500),
                showarrow=False
            )
        ]
    )
    
    st.plotly_chart(fig_modes, use_container_width=True, key="mode_breakdown_pie")
    st.markdown('<div class="card-header"></div>', unsafe_allow_html=True)

with col3:
    # Top Subreddits Card
    st.markdown('<div class="card-header">Top Subreddits Engagement</div>', unsafe_allow_html=True)
    
    # Get categories data from database
    categories_data = get_top_categories_data()
    
    if categories_data is not None and not categories_data.empty:
        y_data = [f"{row['subreddit'].title()}" for _, row in categories_data.iterrows()]
        x_data = categories_data['post_count'].tolist()
    else:
        categories_data = pd.DataFrame({
            'subreddit': ['Politics', 'US Politics', 'World News', 'Conservative', 'Libertarian'],
            'post_count': [150, 120, 80, 65, 45]
        })
        y_data = [f"{label}" for label in categories_data['subreddit']]
        x_data = categories_data['post_count'].tolist()

    # Horizontal bar chart
    fig_categories = go.Figure()
    
    fig_categories.add_trace(go.Bar(
        y=y_data,
        x=x_data,
        orientation='h',
        name='Posts',
        marker_color='#FF4500',
        text=x_data,
        textposition='auto',
        hovertemplate='<b>%{y}</b><br>Posts: %{x:,}<extra></extra>'
    ))
    
    fig_categories.update_layout(
        height=300,
        showlegend=False,
        margin=dict(l=20, r=20, t=20, b=20),
        font=dict(family='Inter, sans-serif', size=11),
        xaxis_title="Number of Posts",
        yaxis_title="",
        paper_bgcolor='white',
        plot_bgcolor='white',
        xaxis=dict(
            gridcolor='#f1f5f9',
            showgrid=True
        ),
        yaxis=dict(
            categoryorder='total ascending'
        )
    )
    
    st.plotly_chart(fig_categories, use_container_width=True, key="categories_bar")
    st.markdown('<div class="card-header"></div>', unsafe_allow_html=True)
