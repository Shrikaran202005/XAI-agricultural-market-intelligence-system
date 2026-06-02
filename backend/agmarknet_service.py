import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class AgmarknetService:
    """Agricultural data service - uses CSV data only, no API calls"""
    
    def __init__(self):
        self.csv_path = r"c:\Data\XAI project\data.gov.in-1.csv"
        self.df = self._load_csv_data()
        self.sample_data = self._prepare_sample_data()
        print(f"✅ AgmarknetService initialized with {len(self.df):,} CSV records")
    
    def _load_csv_data(self):
        """Load data from CSV file only"""
        try:
            df = pd.read_csv(self.csv_path)
            df.columns = df.columns.str.lower().str.strip()
            
            # Convert types
            df['modal_price'] = pd.to_numeric(df['modal_price'], errors='coerce')
            df['min_price'] = pd.to_numeric(df.get('min_price', 0), errors='coerce')
            df['max_price'] = pd.to_numeric(df.get('max_price', 0), errors='coerce')
            df['arrival_date'] = pd.to_datetime(df['arrival_date'], format='%d/%m/%Y', errors='coerce')
            
            # Clean
            df = df.dropna(subset=['modal_price', 'arrival_date', 'state', 'commodity'])
            df = df[df['modal_price'] > 0]
            
            return df
        except Exception as e:
            print(f"Error loading CSV: {e}")
            return pd.DataFrame()
    
    def _prepare_sample_data(self):
        """Prepare sample data from CSV for XAI service"""
        if len(self.df) == 0:
            return []
        
        records = []
        for _, row in self.df.head(1000).iterrows():
            records.append({
                'crop': row['commodity'].lower(),
                'state': row['state'],
                'district': row.get('district', 'Unknown'),
                'market': row.get('market', 'Unknown'),
                'price': float(row['modal_price']),
                'min_price': float(row.get('min_price', row['modal_price'] * 0.8)),
                'max_price': float(row.get('max_price', row['modal_price'] * 1.2)),
                'date': row['arrival_date'].strftime('%Y-%m-%d'),
                'quantity': 100
            })
        return records
    
    def get_latest_prices(self, crop, state=None, days=30):
        """Get latest prices from CSV data"""
        crop = crop.lower()
        df = self.df[self.df['commodity'].str.lower() == crop]
        
        if state:
            df = df[df['state'].str.lower() == state.lower()]
        
        if len(df) == 0:
            return None
        
        latest = df.nlargest(1, 'arrival_date').iloc[0]
        
        return {
            'crop': crop,
            'state': latest['state'],
            'price': float(latest['modal_price']),
            'min_price': float(latest.get('min_price', latest['modal_price'] * 0.8)),
            'max_price': float(latest.get('max_price', latest['modal_price'] * 1.2)),
            'date': latest['arrival_date'].strftime('%Y-%m-%d'),
            'market': latest.get('market', 'Unknown')
        }
    
    def get_latest_prices_all_states(self, crop, days=7):
        """Get latest prices across all states from CSV"""
        crop = crop.lower()
        df = self.df[self.df['commodity'].str.lower() == crop]
        
        if len(df) == 0:
            return []
        
        # Get most recent date
        latest_date = df['arrival_date'].max()
        recent = df[df['arrival_date'] >= latest_date - timedelta(days=days)]
        
        results = []
        for state in recent['state'].unique():
            state_df = recent[recent['state'] == state]
            if len(state_df) > 0:
                latest = state_df.nlargest(1, 'arrival_date').iloc[0]
                results.append({
                    'state': state,
                    'price': float(latest['modal_price']),
                    'date': latest['arrival_date'].strftime('%Y-%m-%d')
                })
        
        return results
    
    def get_price_trend(self, crop=None, state=None, days=30):
        """Get price trend from CSV data"""
        df = self.df.copy()
        
        if crop:
            df = df[df['commodity'].str.lower() == crop.lower()]
        if state:
            df = df[df['state'].str.lower() == state.lower()]
        
        if len(df) == 0:
            return {'labels': [], 'datasets': []}
        
        # Group by date and calculate average
        df['date_str'] = df['arrival_date'].dt.strftime('%Y-%m-%d')
        daily = df.groupby('date_str')['modal_price'].mean().reset_index()
        daily = daily.sort_values('date_str').tail(30)
        
        return {
            'labels': daily['date_str'].tolist(),
            'datasets': [{
                'label': f"{crop or 'All'} Price Trend",
                'data': daily['modal_price'].round(2).tolist()
            }]
        }
    
    def get_price_stats(self, crop=None, state=None):
        """Get price statistics from CSV"""
        df = self.df.copy()
        
        if crop:
            df = df[df['commodity'].str.lower() == crop.lower()]
        if state:
            df = df[df['state'].str.lower() == state.lower()]
        
        if len(df) == 0:
            return None
        
        return {
            'min': float(df['modal_price'].min()),
            'max': float(df['modal_price'].max()),
            'mean': float(df['modal_price'].mean()),
            'median': float(df['modal_price'].median()),
            'count': len(df)
        }
    
    def get_top_crops(self, limit=15):
        """Get top commodities from CSV"""
        return self.df['commodity'].value_counts().head(limit).index.tolist()
    
    def get_states(self):
        """Get unique states from CSV"""
        return self.df['state'].unique().tolist()
