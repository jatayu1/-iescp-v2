export default {
    template: `
    <div class="container mt-4">
        <h2 class="text-center" v-if="role == 'influencer'">Influencer Analytics</h2>
        <h2 class="text-center" v-if="role == 'sponsor'">Sponsor Analytics</h2>
        <div class="row g-3">
            <!-- Top Metrics -->
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-primary text-white text-center" v-if="role == 'influencer'">
                        Total Campaign Earnings
                    </div>
                    <div class="card-header bg-primary text-white text-center" v-if="role == 'sponsor'">
                        Total Campaign Expenditure
                    </div>
                    <div class="card-body text-center">
                        <h3>{{ totalEarnings }}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-success text-white text-center">
                        Campaigns Completed
                    </div>
                    <div class="card-body text-center">
                        <h3>{{ campaignsCompleted }}</h3>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <!-- Monthly Campaign Performance -->
            <div class="col-md-12 mb-4">
                <div class="card same-height">
                    <div class="card-header bg-primary text-white">
                        Campaign Performance
                        <select v-model="selectedTimeInterval" class="form-select form-select-sm float-end" @change="updateBarChart">
                            <option value="1">Last Month</option>
                            <option value="3">Last 3 Months</option>
                            <option value="6">Last 6 Months</option>
                            <option value="12">Last Year</option>
                        </select>
                    </div>
                    <div class="card-body">
                        <canvas id="lineChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Campaign Status Distribution -->
            <div class="col-md-6 mb-4">
                <div class="card same-height">
                    <div class="card-header bg-success text-white text-center">
                        Campaign Status Distribution
                    </div>
                    <div class="card-body">
                        <canvas id="pieChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Top Performing Campaigns -->
            <div class="col-md-6 mb-4">
                <div class="card same-height">
                <div class="card-header bg-info text-white text-center" v-if="role == 'influencer'">
                        Top 10 Campaigns
                    </div>
                    <div class="card-header bg-info text-white text-center" v-if="role == 'sponsor'">
                        Top 10 Campaigns Expenditure
                    </div>
                    <div class="card-body">
                        <canvas id="topCampaignsBarChart"></canvas>
                    </div>
                </div>
            </div>

        </div>
    </div>
    `,
    data() {
        return {
            lineChart: null,
            pieChart: null,
            topCampaignsBarChart: null,
            selectedTimeInterval: "1", // Default to last month
            totalEarnings: "$0",
            campaignsCompleted: 0,
            lineChartData: {
                labels: [],
                datasets: [
                    {
                        label: "Earnings ($)",
                        backgroundColor: "#42A5F5",
                        data: [],
                    },
                ],
            },
            pieChartData: {
                labels: ["Completed", "In Progress", "draft"],
                datasets: [
                    {
                        label: "Campaign Status",
                        backgroundColor: ["#66BB6A", "#FFA726", "#29B6F6"],
                        data: [],
                    },
                ],
            },
            topCampaignsData: {
                labels: [],
                datasets: [
                    {
                        label: "Earnings ($)",
                        backgroundColor: "#29B6F6",
                        data: [],
                    },
                ],
            },
            token : localStorage.getItem("auth-token"),
            role : localStorage.getItem("role")
        };
    },
    methods: {
        initializeCharts() {
            // Line Chart
            const barCtx = document.getElementById("lineChart").getContext("2d");
            this.lineChart = new Chart(barCtx, {
                type: "line",
                data: this.lineChartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                },
            });

            // Pie Chart
            const pieCtx = document.getElementById("pieChart").getContext("2d");
            this.pieChart = new Chart(pieCtx, {
                type: "pie",
                data: this.pieChartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                },
            });

            // Top Campaigns Bar Chart
            const topCampaignsCtx = document.getElementById("topCampaignsBarChart").getContext("2d");
            this.topCampaignsBarChart = new Chart(topCampaignsCtx, {
                type: "bar",
                data: this.topCampaignsData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                },
            });
        },
        updateBarChart() {
            // Update the bar chart data based on the selected time interval
            if (this.selectedTimeInterval === "1") {
                this.lineChartData.labels = Object.keys(this.chartData.lastMonth);
                this.lineChartData.datasets[0].data = Object.values(this.chartData.lastMonth);
            } else if (this.selectedTimeInterval === "3") {
                this.lineChartData.labels = Object.keys(this.chartData.last3Months);
                this.lineChartData.datasets[0].data = Object.values(this.chartData.last3Months);
            } else if (this.selectedTimeInterval === "6") {
                this.lineChartData.labels = Object.keys(this.chartData.last6Months);
                this.lineChartData.datasets[0].data = Object.values(this.chartData.last6Months);
            } else if (this.selectedTimeInterval === "12") {
                this.lineChartData.labels = Object.keys(this.chartData.last12Months);
                this.lineChartData.datasets[0].data = Object.values(this.chartData.last12Months);
            }
            if (this.lineChart) this.lineChart.update();
        },
        async fetchChartData() {
            try {
                const response = await fetch("/api/user-stats", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": localStorage.getItem("auth-token"),
                        'role' : localStorage.getItem("role")
                    },
                });

                if (!response.ok) throw new Error("Failed to fetch data");

                const data = await response.json();

                // Update data fields
                this.totalEarnings = `$${data.total_earning}`;
                this.campaignsCompleted = data.campaigns_completed;

                // Update chart data
                this.chartData = {
                    lastMonth: data.campaign_performance_last_month,
                    last3Months: data.campaign_performance_last_3_month,
                    last6Months: data.campaign_performance_last_6_month,
                    last12Months: data.campaign_performance_last_12_month,
                };

                this.pieChartData.datasets[0].data = [
                    data.campaign_status_distribution.completed,
                    data.campaign_status_distribution.inprogress,
                    data.campaign_status_distribution.draft,
                ];

                this.topCampaignsData.labels = Object.keys(data.top_performing_campaigns);
                this.topCampaignsData.datasets[0].data = Object.values(data.top_performing_campaigns);

                // Re-render charts
                if (this.lineChart) this.lineChart.update();
                if (this.pieChart) this.pieChart.update();
                if (this.topCampaignsBarChart) this.topCampaignsBarChart.update();
            } catch (error) {
                console.error("Error fetching chart data:", error);
            }
        },
    },
    mounted() {
        this.fetchChartData().then(() => {
            this.updateBarChart(); // Ensure the chart is updated after fetching data
        });
        this.initializeCharts();
    },
    
};
