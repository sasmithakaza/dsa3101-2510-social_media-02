import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px

st.set_page_config(
    page_title="Dashboard Analytics",
    page_icon="📊",
    layout="wide"
)

# Clean CSS with minimal spacing
st.markdown("""
<style>
    .header-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    .header-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        object-fit: contain;
        background: white;
        padding: 8px;
    }
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #ff4500;
        font-family: 'Arial', sans-serif;
        margin: 0;
    }
    .section-header {
        font-size: 1.3rem;
        font-weight: bold;
        color: #1a1a1b;
        margin-bottom: 0.5rem;
        font-family: 'Arial', sans-serif;
        text-align: center;
    }
    
    /* Clean white background */
    .main {
        background-color: white !important;
    }
    .stApp {
        background-color: white !important;
    }
    
    .stPlotlyChart {
        border-radius: 0px;
    }
    
    /* Reduce space between columns */
    [data-testid="column"] {
        gap: 0rem;
    }
</style>
""", unsafe_allow_html=True)

# Header
st.markdown(
    '''
    <div class="header-container">
        <div><img class="header-icon" src="https://www.redditstatic.com/shreddit/assets/favicon/64x64.png"></div>
        <div class="main-header">DASHBOARD ANALYTICS</div>
        <div><img class="header-icon" src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"></div>
    </div>
    ''', 
    unsafe_allow_html=True
)

# Create two main columns with minimal gap
col1, col2 = st.columns([1, 1], gap="small")

with col1:
    # Political Spectrum Pie Chart 
    st.markdown('<div class="section-header">🎯 Political Spectrum</div>', unsafe_allow_html=True)
    
    # Pie chart data for political spectrum
    spectrum = ['Left Wing', 'Right Wing', 'Neutral']
    spectrum_hours = [4.22, 6.5, 2.0]  
    spectrum_display = ['4h 13m', '6h 30m', '2h 0m']
    
    # Pie chart for political spectrum
    fig_spectrum = go.Figure(data=[go.Pie(
        labels=spectrum,
        values=spectrum_hours,
        textinfo='percent',
        textposition='inside',
        hovertemplate='<b>%{label}</b><br>%{customdata}<br>%{percent}<extra></extra>',
        customdata=spectrum_display,
        marker=dict(
            colors=['#ff4500', '#0079d3', '#46d160'],
            line=dict(color='white', width=2)
        )
    )])
    
    fig_spectrum.update_layout(
        height=300,
        showlegend=True,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.2,
            xanchor="center",
            x=0.5
        ),
        margin=dict(l=0, r=0, t=0, b=0),
        font=dict(family='Arial', size=12),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)'
    )
    
    st.plotly_chart(fig_spectrum, use_container_width=True, key="political_spectrum_pie")

    # Screentime Analysis Section
    st.markdown('<div class="section-header">⏰ Screentime Analysis</div>', unsafe_allow_html=True)
    
    # Mode Breakdown Donut Chart
    modes = ['Skeptical Mode', 'Vibes Mode']
    hours = [4.22, 6.5]
    time_display = ['4h 13m', '6h 30m']
    
    fig_modes = go.Figure(data=[go.Pie(
        labels=modes,
        values=hours,
        textinfo='label+text',  
        text=time_display, 
        textposition='outside',
        hovertemplate='<b>%{label}</b><br>%{customdata}<extra></extra>',
        customdata=time_display,
        marker=dict(colors=['#ff4500', '#0079d3'], line=dict(color='white', width=2)),
        hole=0.7, 
        textfont=dict(size=12)
    )])
    
    fig_modes.update_layout(
        height=300,
        showlegend=False,
        margin=dict(l=0, r=0, t=0, b=0),
        font=dict(family='Arial', size=12),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        annotations=[
            dict(
                text='10h 43m',
                x=0.5, y=0.5,
                font=dict(size=24, color='#ff4500', family='Arial', weight='bold'),
                showarrow=False
            ),
            dict(
                text='Total Screentime',
                x=0.5, y=0.42,
                font=dict(size=14, color='#7c7c7c', family='Arial'),
                showarrow=False
            )
        ]
    )
    
    st.plotly_chart(fig_modes, use_container_width=True, key="mode_breakdown_pie")

with col2:
    # Top Subreddits Bar Chart section - Smaller size
    st.markdown('<div class="section-header">🏆 Top Subreddits Engagement</div>', unsafe_allow_html=True)
    st.markdown('*Posts and engagement across your most visited communities*')
    
    # Data for bar chart
    subreddit_data = pd.DataFrame({
        'Subreddit': ['r/Singapore', 'r/askSingapore', 'r/SGexams', 'r/SingaporeFI'],
        'Posts': [1200, 845, 612, 398],
        'Engagement_Score': [85, 72, 68, 45]
    })
    
    # Horizontal bar chart
    fig_bar = go.Figure()
    
    fig_bar.add_trace(go.Bar(
        y=subreddit_data['Subreddit'],
        x=subreddit_data['Posts'],
        orientation='h',
        name='Posts',
        marker_color='#ff4500',
        text=subreddit_data['Posts'],
        textposition='auto',
        hovertemplate='<b>%{y}</b><br>Posts: %{x:,}<extra></extra>'
    ))
    
    fig_bar.update_layout(
        height=400,  # Reduced from 650 to 400
        showlegend=False,
        margin=dict(l=0, r=0, t=0, b=0),
        font=dict(family='Arial', size=12),
        xaxis_title="Number of Posts",
        yaxis_title="",
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        xaxis=dict(
            gridcolor='#f0f0f0',
            showgrid=True
        ),
        yaxis=dict(
            categoryorder='total ascending'
        )
    )
    
    st.plotly_chart(fig_bar, use_container_width=True, key="top_subreddits_bar")