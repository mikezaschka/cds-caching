# Cache Performance Dashboard

A comprehensive UI5-based dashboard for monitoring and analyzing cache performance using the enhanced CDS Caching Statistics API.

## Features

### 📊 **Main Dashboard**
- **Real-time Metrics**: Hit ratio, latency, throughput, error rate, memory usage
- **Performance Cards**: Visual status indicators with color-coded performance levels
- **Interactive Charts**: Latency distribution and operations breakdown
- **Auto-refresh**: Automatic data updates every 30 seconds
- **Quick Actions**: Navigation to detailed views and statistics persistence

### 🚨 **Alerts Management**
- **Alert Filtering**: Filter by severity, type, and resolution status
- **Alert Resolution**: Mark individual alerts as resolved
- **Bulk Operations**: Clear all alerts at once
- **Real-time Updates**: Live alert monitoring

### 💡 **Performance Insights**
- **AI-Powered Recommendations**: Automatic performance optimization suggestions
- **Insight Categories**: Hit ratio, latency, memory, keys, throughput, error rate
- **Actionable Advice**: Specific actions to improve cache performance
- **Insight Summary**: Overview of warnings, errors, and informational insights

### 🔑 **Key Analysis**
- **Top Accessed Keys**: Most frequently used cache keys with usage statistics
- **Cold Keys**: Least recently accessed keys for cleanup opportunities
- **Key Statistics**: Overview of key distribution and access patterns
- **Detailed Tables**: Comprehensive key access information

## Technology Stack

- **UI5 Framework**: Modern UI5 with TypeScript support
- **SAP Fiori Cards**: Responsive card-based layout
- **SAP Viz Charts**: Interactive data visualization
- **SAP UI Table**: Advanced table controls for data display
- **TypeScript**: Type-safe development

## Getting Started

### Prerequisites
- Node.js 18+ 
- UI5 CLI
- CDS Caching Plugin with enhanced statistics enabled

### Installation

1. **Install Dependencies**
   ```bash
   cd dashboard
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

### Configuration

The dashboard connects to the cache statistics API at `/cache-stats`. Ensure your CDS application has:

1. **Enhanced Statistics Enabled**
   ```javascript
   // In your caching service configuration
   statistics: {
       enabled: true,
       enableKeyTracking: true,
       enablePerformanceInsights: true,
       enableAlerts: true
   }
   ```

2. **Statistics Service Running**
   - The `/cache-stats` endpoint should be available
   - Database tables for statistics should be deployed

## API Integration

The dashboard uses the following API endpoints:

### Statistics
- `GET /cache-stats/Statistics?$filter=period eq 'current'` - Current statistics
- `POST /cache-stats/getStatistics` - Historical statistics
- `POST /cache-stats/persistStatistics` - Persist current statistics

### Alerts
- `POST /cache-stats/getAlerts` - Get alerts with filtering
- `POST /cache-stats/resolveAlert` - Resolve specific alert
- `POST /cache-stats/clearAlerts` - Clear all alerts

### Insights
- `POST /cache-stats/getPerformanceInsights` - Get performance insights

### Keys
- `POST /cache-stats/getTopKeys` - Get most accessed keys
- `POST /cache-stats/getColdKeys` - Get least accessed keys

## Dashboard Sections

### 1. Main Dashboard (`/`)
- Overview of all key metrics
- Real-time performance indicators
- Interactive charts and graphs
- Quick navigation to detailed views

### 2. Alerts (`/alerts`)
- Comprehensive alert management
- Advanced filtering options
- Alert resolution workflow
- Bulk operations

### 3. Performance Insights (`/insights`)
- AI-powered recommendations
- Performance optimization suggestions
- Insight categorization
- Actionable advice

### 4. Key Analysis (`/keys`)
- Cache key access patterns
- Top and cold key identification
- Detailed key statistics
- Access pattern analysis

## Customization

### Adding New Metrics
1. Update the `CacheStatisticsService.ts` interface
2. Add new metric cards to `Main.view.xml`
3. Update the formatter for proper display

### Custom Charts
1. Modify chart data preparation in controllers
2. Update chart configurations in views
3. Add new chart types as needed

### Styling
- Custom CSS can be added to `webapp/css/`
- Theme customization through UI5 theming
- Responsive design adjustments

## Performance Considerations

- **Auto-refresh**: Configurable refresh intervals
- **Data Caching**: Client-side caching for better performance
- **Lazy Loading**: Data loaded on demand for detailed views
- **Error Handling**: Graceful degradation on API failures

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Verify the cache statistics service is running
   - Check network connectivity
   - Ensure CORS is properly configured

2. **No Data Displayed**
   - Verify statistics are enabled in the caching service
   - Check if cache operations are being performed
   - Ensure database tables are deployed

3. **Chart Display Issues**
   - Verify SAP Viz library is loaded
   - Check chart data format
   - Ensure proper chart configuration

### Debug Mode
Enable debug logging by setting the log level in the browser console:
```javascript
sap.ui.getCore().getConfiguration().setLogLevel(sap.ui.core.LogLevel.DEBUG);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the Apache-2.0 License.

## Support

For issues and questions:
- Check the main CDS Caching Plugin documentation
- Review the API documentation
- Open an issue in the repository
