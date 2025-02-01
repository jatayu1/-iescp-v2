export default {
    template: `
    <div class="container">
        <h2 class="welcome-title">Welcome, Sponsor</h2>

        <!-- Users Table -->
        <div class="card">
            <div class="card-header bg-primary text-white" @click="toggleProfileDetails">
                <h3>Profile Details</h3>
                <i :class="profileDetailsCollapsed ? 'fas fa-chevron-down' : 'fas fa-chevron-up'" class="arrow-icon"></i>
            </div>
            <div class="card-body" v-show="!profileDetailsCollapsed">
                <table class="table">
                    <thead>
                        <tr>
                            <th class="table-header">Full Name</th>
                            <th class="table-header">Username</th>
                            <th class="table-header">Email</th>
                            <th class="table-header">Sponsor Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{{ user.fullname }}</td>
                            <td>{{ user.username }}</td>
                            <td>{{ user.email }}</td>
                            <td>
                                <ul>
                                    <li><strong>Industry:</strong> {{ sponsorData.industry }}</li>
                                </ul>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Campaigns Table -->
        <div class="card">
            <div class="card-header bg-primary text-white" @click="toggleCampaigns">
                <h3>Active Campaigns</h3>
                <i :class="campaignsCollapsed ? 'fas fa-chevron-down' : 'fas fa-chevron-up'" class="arrow-icon"></i>
            </div>
            <div class="card-body" v-show="!campaignsCollapsed">
                <div v-if="!campaignData || campaignData.length === 0">
                    <p>No Active Campaigns Available</p>
                </div>
                <div v-else>
                    <table class="table">
                        <thead>
                            <tr>
                                <th class="table-header">Campaign Name</th>
                                <th class="table-header">Start Date</th>
                                <th class="table-header">End Date</th>
                                <th class="table-header">Budget</th>
                                <th class="table-header">Assigned to</th>
                                <th class="table-header">Flag</th>
                                <th class="table-header">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="campaign in campaignData" :key="campaign.id">
                                <td>{{ campaign.name }}</td>
                                <td>{{ campaign.start_date }}</td>
                                <td>{{ campaign.end_date }}</td>
                                <td>{{ campaign.budget }}</td>
                                <td>{{ campaign.assigned_to }}</td>
                                <td>{{ campaign.flagged }}</td>
                                <td>
                                    <button class="btn btn-success btn-sm" @click="markComplete(campaign.id)">Mark Complete</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Ad requests sent -->
        <div class="card">
            <div class="card-header bg-primary text-white" @click="toggleSentAdRequests">
                <h3>Ad Requests (Sent)</h3>
                <i :class="SentAdRequestsCollapsed ? 'fas fa-chevron-down' : 'fas fa-chevron-up'" class="arrow-icon"></i>
            </div>
            <div class="card-body" v-show="!SentAdRequestsCollapsed">
                <div v-if="!adRequestsSent">
                    <p>No ad request sent</p>
                </div>
                <div v-else>
                    <table class="table">
                        <thead>
                            <tr>
                                <th class="table-header">Campaign</th>
                                <th class="table-header">Sent To</th>
                                <th class="table-header">Proposed Budget</th>
                                <th class="table-header">Flag</th>
                                <th class="table-header">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="requests in adRequestsSent" :key="requests.id">
                                <td>{{ campaignNames[requests.campaign_id] || 'Unknown Campaign' }}</td>
                                <td>{{ userNames[requests.sent_to] || 'Unknown User' }}</td>
                                <td>{{ requests.payment_amount }}</td>
                                <td>{{ requests.flagged }}</td>
                                <td>
                                    <button class="btn btn-warning btn-sm" @click="editRequests(requests.id)">Edit</button> | 
                                    <button class="btn btn-danger btn-sm" @click="unsendAdrequest(requests.campaign_id, requests.sent_to)">
                                        Unsend
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Ad requests recived -->
        <div class="card">
            <div class="card-header bg-primary text-white" @click="toggleRecivedAdRequests">
                <h3>Ad Requests (Recived)</h3>
                <i :class="RecivedAdRequestsCollapsed ? 'fas fa-chevron-down' : 'fas fa-chevron-up'" class="arrow-icon"></i>
            </div>
            <div class="card-body" v-show="!RecivedAdRequestsCollapsed">
                <div v-if="!adRequestsReceived || adRequestsReceived.length === 0">
                    <p>No ad request recived</p>
                </div>
                <div v-else>
                    <table class="table">
                        <thead>
                            <tr>
                                <th class="table-header">Campaign</th>
                                <th class="table-header">Sent By</th>
                                <th class="table-header">Proposed Budget</th>
                                <th class="table-header">Flag</th>
                                <th class="table-header">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="requests in adRequestsReceived" :key="requests.id">
                                <td>{{ campaignNames[requests.campaign_id] || 'Unknown Campaign' }}</td>
                                <td>{{ userNames[requests.sent_by] || 'Unknown User' }}</td>
                                <td>{{ requests.payment_amount }}</td>
                                <td>{{ requests.flagged }}</td>
                                <td>
                                    <button class="btn btn-success btn-sm" @click="accept(requests.id, requests.sent_by)">Accept</button> | 
                                    <button class="btn btn-warning btn-sm" @click="negotiate(requests.id)">Negotiate</button> | 
                                    <button class="btn btn-danger btn-sm" @click="rejectAdrequest(requests.campaign_id, requests.sent_by)">
                                        Reject
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            user: {
                id : "",
                username: "",
                email: "",
                fullname: "",
            },
            sponsorData: {
                industry: "NA",
            },
            role: localStorage.getItem("role"),
            campaignData: null,
            adRequestsSent: null,
            adRequestsReceived: null,
            token: localStorage.getItem("auth-token"),
            profileDetailsCollapsed: false,
            campaignsCollapsed: false,
            SentAdRequestsCollapsed: false,
            RecivedAdRequestsCollapsed: false,
            campaignNames: {},
            userNames: {},
        };
    },
    methods: {
        toggleProfileDetails() {
            this.profileDetailsCollapsed = !this.profileDetailsCollapsed;
        },
        toggleCampaigns() {
            this.campaignsCollapsed = !this.campaignsCollapsed;
        },
        toggleSentAdRequests() {
            this.SentAdRequestsCollapsed = !this.SentAdRequestsCollapsed;
        },
        toggleRecivedAdRequests() {
            this.RecivedAdRequestsCollapsed = !this.RecivedAdRequestsCollapsed;
        },
        async user_info() {
            try {
                const response = await fetch('/api/current-user', {
                    method: 'GET',
                    headers: {
                        "Authentication-Token": this.token
                    },
                });

                const data = await response.json();

                if (response.ok) {
                    this.user.id = data.id;
                    this.user.username = data.username;
                    this.user.email = data.email;
                    this.user.fullname = data.fullname;

                    // Fetch sponsor info after user info is set
                    if (this.user.id) {
                        this.sponsor_info(this.user.id);
                    }
                } else {
                    console.error('Failed to fetch user info');
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        },
        async sponsor_info(id) {
            try {
                const response = await fetch(`/api/sponsor-details/${id}`, {
                    method: 'GET',
                    headers: {
                        "Content-Type" : "application/json",
                        "Authentication-Token": this.token
                    },
                });

                const data = await response.json();
                if (response.ok) {
                    this.sponsorData.industry = data.industry;
                } else {
                    console.error('Failed to fetch user info');
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        },
        async fetchCampaignNames() {
            try {
                const response = await fetch('/api/campaigns', {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": this.token
                    },
                });
                const campaigns = await response.json();
                if (response.ok) {
                    this.campaignNames = campaigns.reduce((acc, campaign) => {
                        acc[campaign.id] = campaign.name;                        
                        return acc;
                    }, {});

                    this.campaignData = campaigns.filter(campaign => 
                        campaign.status === 1 && campaign.created_by === this.user.id
                    );
                }
            } catch (error) {
                console.error('Error fetching campaign names:', error);
            }
        },
        async fetchUserNames() {
            try {
                const response = await fetch('/api/users', {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": this.token
                    },
                });
                const users = await response.json();
                if (response.ok) {
                    this.userNames = users.reduce((acc, user) => {
                        acc[user.id] = `${user.fullname} (${user.username})`;
                        return acc;
                    }, {});
                }
            } catch (error) {
                console.error('Error fetching user names:', error);
            }
        },
        async fetchAdRequests() {
            try {
                await Promise.all([this.fetchCampaignNames(), this.fetchUserNames()]);
                const response = await fetch('/api/ad_requests', {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": this.token
                    },
                });
                const data = await response.json();

                if (response.ok) {
                    // Filter sent and received ad requests based on the current user
                    const filteredSent = data.filter(adRequest => adRequest.sent_by === this.user.id);
                    if (filteredSent.length > 0) {
                        this.adRequestsSent = filteredSent;
                    }

                    // Filter received ad requests
                    const filteredReceived = data.filter(adRequest => adRequest.sent_to === this.user.id);
                    if (filteredReceived.length > 0) {
                        this.adRequestsReceived = filteredReceived;
                    }
                } else {
                    console.error('Failed to fetch ad requests');
                }
            } catch (error) {
                console.error('Error fetching ad requests:', error);
            }
        },
        async unsendAdrequest(campaign_id, sent_to) {
            const response = await fetch("/api/ad_requests", {
                method: "DELETE",
                headers: { "Content-Type": "application/json", "Authentication-Token": this.token },
                body: JSON.stringify({
                    campaign_id: campaign_id,
                    sent_by: this.user.id,
                    sent_to: sent_to,
                }),
            });
            if (response.ok) {
                alert("Ad request rejected");
                // Reassign to trigger reactivity
                this.adRequestsSent = this.adRequestsSent.filter(request => 
                    !(request.campaign_id === campaign_id && request.sent_to === sent_to)
                );
            }
        },
        async rejectAdrequest(campaign_id, sent_by) {
            const response = await fetch("/api/ad_requests", {
                method: "DELETE",
                headers: { "Content-Type": "application/json", "Authentication-Token": this.token },
                body: JSON.stringify({
                    campaign_id: campaign_id,
                    sent_by: sent_by,
                    sent_to: this.user.id,
                }),
            });
            if (response.ok) {
                alert("Ad request rejected");
                this.adRequestsReceived = this.adRequestsReceived.filter(request => 
                    !(request.campaign_id === campaign_id && request.sent_by === sent_by)
                );
            }
        },
        async accept(id, uid) {
            try {
                const response = await fetch(`/api/accept`, {
                    method: 'POST',
                    headers: {
                        "Content-Type" : "application/json",
                        "Authentication-Token": this.token
                    },
                    body: JSON.stringify({
                        req_id: id,
                        uid: uid,
                    }),
                });

                const data = await response.json();
                if (response.ok) {
                    alert("Ad request accepted");
                    // Update the `adRequestsReceived` array to remove the accepted request
                    this.adRequestsReceived = this.adRequestsReceived.filter(request => request.id !== id);

                    // Add the campaign to `campaignData`
                    const acceptedRequest = this.adRequestsReceived.find(request => request.id === id);
                    if (acceptedRequest) {
                        const campaign = {
                            id: acceptedRequest.campaign_id,
                            name: this.campaignNames[acceptedRequest.campaign_id],
                            start_date: acceptedRequest.start_date,
                            end_date: acceptedRequest.end_date,
                            budget: acceptedRequest.payment_amount,
                            assigned_to: uid,
                            flagged: acceptedRequest.flagged,
                            status: 1,  // Set status to "Active"
                        };

                        // Ensure that the campaign is added to `campaignData`
                        this.campaignData.push(campaign);
                    }
                } else {
                    console.error('Failed to accept the request.');
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        },
        async markComplete(id) {
            try {
                const response = await fetch(`/api/campaigns/${id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": this.token,
                    },
                    body: JSON.stringify({
                        status : "2"
                    }),
                });

                if (response.ok) {
                    alert("Campaign marked as complete.");
                    this.campaignData = this.campaignData.filter(campaign => campaign.id !== id);
                } else {
                    const error = await response.json();
                    console.error("Failed to update campaign:", error);
                    alert("Failed to update campaign.");
                }
            } catch (error) {
                console.error("Error updating campaign:", error);
                alert("An error occurred while updating the campaign.");
            }
        },
        negotiate(id) {
            this.$router.push({ name: "negotiate", params: { id } });
        },
        editRequests(id) {
            this.$router.push({ name: "editRequests", params: { id } });
        },
    },
    async created() {
        try {
            await this.user_info();
            await this.fetchAdRequests();
        } catch (error) {
            console.error('Error during component creation:', error);
        }
    },
    computed: {
        totalFollowers() {
            if (!this.sponsorData) return 0;
            return (this.sponsorData.social_links.instagram_followers || 0) +
                   (this.sponsorData.social_links.facebook_followers || 0) +
                   (this.sponsorData.social_links.youtube_followers || 0) +
                   (this.sponsorData.social_links.x_followers || 0) +
                   (this.sponsorData.social_links.linkedin_followers || 0);
        }
    },
}
