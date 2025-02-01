export default {
    template: `
    <div class="container mt-4">
        <h2 class="text-center">Admin Dashboard</h2>

        <!-- Top Metrics -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-header bg-primary text-white text-center">Total Users</div>
                    <div class="card-body text-center">
                        <h3>{{ totalUsers }}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-header bg-success text-white text-center">Total Campaigns</div>
                    <div class="card-body text-center">
                        <h3>{{ totalCampaigns }}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-header bg-warning text-white text-center">Total Transaction</div>
                    <div class="card-body text-center">
                        <h3>{{ totalTransaction }}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-header bg-danger text-white text-center">Pending Approvals</div>
                    <div class="card-body text-center">
                        <h3>{{ pendingApprovals }}</h3>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts Section -->
        <div class="row">
            <!-- Monthly Revenue -->
            <div class="col-md-6 mb-4">
                <div class="card same-height">
                    <div class="card-header bg-primary text-white">
                        Timely Transaction
                        <select v-model="selectedTimeIntervalTransaction" class="form-select form-select-sm float-end" @change="updateTransactionChart">
                            <option value="1">Last Month</option>
                            <option value="3">Last 3 Months</option>
                            <option value="6">Last 6 Months</option>
                            <option value="12">This Year</option>
                        </select>
                    </div>
                    <div class="card-body">
                        <canvas id="revenueChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- User Registration Trends -->
            <div class="col-md-6 mb-4">
                <div class="card same-height">
                    <div class="card-header bg-success text-white">
                        User Registration Trends
                        <select v-model="selectedTimeIntervalUserRegistration" class="form-select form-select-sm float-end" @change="updateUserRegistration">
                            <option value="1">Last Month</option>
                            <option value="3">Last 3 Months</option>
                            <option value="6">Last 6 Months</option>
                            <option value="12">Last Year</option>
                        </select>
                    </div>
                    <div class="card-body">
                        <canvas id="UserRegChart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <!-- Monthly Revenue -->
            <div class="col-md-12 mb-4">
                <div class="card table-card">
                    <div class="card-header bg-primary text-white">
                        Activate User Profiles
                    </div>
                    <div class="card-body">
                        
                        <div v-if="!pendingApprovalData || pendingApprovalData.length === 0">
                            <p>No Approval Pending</p>
                        </div>
                        <div v-else style="overflow-y: auto; max-height: 400px;">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th class="table-header">Full Name</th>
                                        <th class="table-header">Username</th>
                                        <th class="table-header">Email</th>
                                        <th class="table-header">Role</th>
                                        <th class="table-header">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="user in pendingApprovalData" :key="user.id">
                                        <td>{{ user.fullname }}</td>
                                        <td>{{ user.username }}</td>
                                        <td>{{ user.email }}</td>
                                        <td>{{ user.role }}</td>
                                        <td>
                                            <button class="btn btn-success btn-sm" @click="Approve(user.id)">Approve</button>
                                            <button class="btn btn-danger btn-sm" @click="Reject(user.id)">Reject</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            selectedTimeIntervalTransaction: "1", // Default is last month
            selectedTimeIntervalUserRegistration: "1", // Default is last month
            totalUsers: 0,
            totalCampaigns: 0,
            totalTransaction: "$0",
            pendingApprovals: 0,
            revenueChart: null,
            transactionData: {},
            regData: {},
            pendingApprovalData: null,
            token: localStorage.getItem("auth-token"),
            role: localStorage.getItem("role"),
        };
    },
    methods: {
        initializeCharts() {
            const revenueCtx = document.getElementById("revenueChart").getContext("2d");
            this.revenueChart = new Chart(revenueCtx, {
                type: "line",
                data: {
                    labels: [], // Dynamic labels
                    datasets: [
                        {
                            label: "Transactions ($)",
                            data: [], // Dynamic data
                            backgroundColor: "#42A5F5",
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                },
            });

            const userRegCtx = document.getElementById("UserRegChart").getContext("2d");
            this.UserRegChart = new Chart(userRegCtx, {
                type: "line",
                data: {
                    labels: [], // Dynamic labels
                    datasets: [
                        {
                            label: "Number of Registration",
                            data: [], // Dynamic data
                            backgroundColor: "#198754",
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                },
            });
        },
        async fetchDashboardData() {
            try {
                const response = await fetch("/api/user-stats", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": localStorage.getItem("auth-token"),
                    },
                });

                if (!response.ok) throw new Error("Failed to fetch dashboard data");

                const data = await response.json();

                // Update Metrics
                this.totalUsers = data.total_users;
                this.totalCampaigns = data.total_campaigns;
                this.totalTransaction = `$${data.total_transaction}`;
                this.pendingApprovals = data.pending_approvals;

                // Store transaction data for different time intervals
                this.transactionData = {
                    lastMonth: data.transactions_last_month,
                    last3Months: data.transactions_last_3_month,
                    last6Months: data.transactions_last_6_month,
                    last12Months: data.transactions_last_12_month,
                };

                // Store transaction data for different time intervals
                this.regData = {
                    lastMonth: data.user_reg_last_month,
                    last3Months: data.user_reg_last_3_month,
                    last6Months: data.user_reg_last_6_month,
                    last12Months: data.user_reg_last_12_month,
                };

                this.pendingApprovalData = data.inactive_users_list

                // Initialize chart with the default time interval
                this.updateTransactionChart();
                this.updateUserRegistration();
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        },
        updateTransactionChart() {
            let transactionData;
            switch (this.selectedTimeIntervalTransaction) {
                case "1":
                    transactionData = this.transactionData.lastMonth;
                    break;
                case "3":
                    transactionData = this.transactionData.last3Months;
                    break;
                case "6":
                    transactionData = this.transactionData.last6Months;
                    break;
                case "12":
                    transactionData = this.transactionData.last12Months;
                    break;
                default:
                    transactionData = {};
            }

            // Update chart data
            this.revenueChart.data.labels = Object.keys(transactionData);
            this.revenueChart.data.datasets[0].data = Object.values(transactionData);
            this.revenueChart.update();
        },
        updateUserRegistration() {
            let regData;
            switch (this.selectedTimeIntervalUserRegistration) {
                case "1":
                    regData = this.regData.lastMonth;
                    break;
                case "3":
                    regData = this.regData.last3Months;
                    break;
                case "6":
                    regData = this.regData.last6Months;
                    break;
                case "12":
                    regData = this.regData.last12Months;
                    break;
                default:
                    regData = {};
            }

            // Update chart data
            this.UserRegChart.data.labels = Object.keys(regData);
            this.UserRegChart.data.datasets[0].data = Object.values(regData);
            this.UserRegChart.update();
        },
        async Approve(uid){
            const response = await fetch(`/api/approve-user`, {
                method: 'put',
                headers: {
                    "Content-Type" : "application/json",
                    "Authentication-Token": this.token,
                    "Role":this.role,
                },
                body: JSON.stringify({
                    uid: uid,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                alert("User activated")
                this.fetchDashboardData()
            }else {
                alert("error in activation")
                console.log(data)
            }
        },

        async Reject(uid){
            const response = await fetch(`/api/approve-user`, {
                method: 'delete',
                headers: {
                    "Content-Type" : "application/json",
                    "Authentication-Token": this.token,
                    "Role":this.role,
                },
                body: JSON.stringify({
                    uid: uid,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                alert("User activated")
                this.fetchDashboardData()
            }else {
                alert("error in activation")
                console.log(data)
            }
        }
    },
    mounted() {
        this.initializeCharts();
        this.fetchDashboardData();
    },
};
