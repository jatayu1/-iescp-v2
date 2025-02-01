export default {
    template: `
    <div class="container">
        <!-- Campaign Creation Form -->
        <div class="card create-campaign-card">
            <div class="card-header bg-success text-white text-center">
                <h3>Create New Campaign</h3>
            </div>

            <div class="custom-card-body bg-body-tertiary">
                <form @submit.prevent="createCampaign">
                    <div class="custom-form-group">
                        <label for="name">Campaign Name</label>
                        <input
                            type="text"
                            id="name"
                            class="form-control"
                            v-model="newCampaign.name"
                            placeholder="Enter campaign name"
                            required
                        />
                    </div>

                    <div class="custom-form-group">
                        <label for="description">Description</label>
                        <textarea
                            id="description"
                            class="form-control"
                            v-model="newCampaign.description"
                            placeholder="Enter campaign description"
                            rows="4"
                            required
                        ></textarea>
                    </div>

                    <div class="custom-form-row">
                        <div class="custom-form-group custom-form-column">
                            <label for="start_date">Start Date</label>
                            <input
                                type="date"
                                id="start_date"
                                class="form-control"
                                v-model="newCampaign.start_date"
                                required
                            />
                        </div>
                        <div class="custom-form-group custom-form-column">
                            <label for="end_date">End Date</label>
                            <input
                                type="date"
                                id="end_date"
                                class="form-control"
                                v-model="newCampaign.end_date"
                                required
                            />
                        </div>
                    </div>

                    <div class="custom-form-group">
                        <label for="visibility">Visibility</label>
                        <select
                            id="visibility"
                            class="form-control"
                            v-model="newCampaign.visibility"
                        >
                            <option :value="true">Public</option>
                            <option :value="false">Private</option>
                        </select>
                    </div>

                    <button type="submit" class="btn btn-success custom-submit-button">Create Campaign</button>
                </form>
            </div>
        </div>

        <!-- List of Campaigns Created by the User -->
        <div class="card campaigns-list-card mt-4">
            <div class="card-header bg-primary text-white">
                <h3>Your Campaigns</h3>
                <button class="btn btn-secondary btn-sm" @click="downloadCSV()">Download CSV</button>
            </div>
            <div class="card-body">
                <div v-if="!userCampaigns.length">
                    <p>No campaigns created yet. Start by creating one!</p>
                </div>
                <div v-else>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Campaign Name</th>
                                <th>Description</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Budget</th>
                                <th>Visibility</th>
                                <th>Status</th>
                                <th>Assigned to</th>
                                <th>Flag</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="campaign in userCampaigns" :key="campaign.id">
                                <td>{{ campaign.name }}</td>
                                <td>{{ campaign.description }}</td>
                                <td>{{ campaign.start_date }}</td>
                                <td>{{ campaign.end_date }}</td>
                                <td>{{ campaign.budget }}</td>
                                <td>{{ campaign.visibility ? 'Public' : 'Private' }}</td>
                                <td>{{ statusLabels[campaign.status] || "Unknown" }}</td>
                                <td>{{ campaign.assigned_to }}</td>
                                <td>{{ campaign.flagged }}</td>
                                <td>
                                    <button class="btn btn-primary btn-sm" @click="sendAdRequest(campaign.id)" v-if="campaign.status == 0"> Send Ad request </button>  
                                    <button class="btn btn-success btn-sm" @click="markComplete(campaign.id)" v-if="campaign.status == 1" > Mark Complete </button>  
                                    <button class="btn btn-warning btn-sm" @click="editCampaign(campaign.id)" v-if="campaign.status == 0"> Edit </button>  
                                    <button class="btn btn-danger btn-sm" @click="deleteCampaign(campaign.id)" v-if="campaign.status != 1">Delete</button>
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
            newCampaign: {
                name: null,
                description: null,
                start_date: null,
                end_date: null,
                budget: null,
                visibility: true,
            },
            userCampaigns: [],
            token: localStorage.getItem("auth-token"),
            role: localStorage.getItem("role"),
        };
    },
    methods: {
        async fetchUserCampaigns() {
            try {
                const response = await fetch('/api/campaigns', {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": this.token
                    },
                });
    
                const text = await response.text(); // Get the raw response as text
    
                if (response.ok) {
                    const data = JSON.parse(text); // Manually parse the text as JSON
                    this.userCampaigns = data;
                } else {
                    const errorData = JSON.parse(text); // Parse the error message as JSON
                    console.error('Failed to fetch user campaigns:', errorData);
                    alert('Failed to fetch your campaigns');
                }
            } catch (error) {
                console.error('Error fetching user campaigns:', error);
                alert('An error occurred while fetching your campaigns');
            }    
        },        
        async createCampaign() {
            try {
                const response = await fetch('/api/campaigns', {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": this.token
                    },
                    body: JSON.stringify(this.newCampaign),
                });

                const data = await response.json()

                if (response.ok) {
                    this.resetForm();
                    this.fetchUserCampaigns();
                    alert("Campaign created successfully!");
                } else {
                    const text = await response.text(); // Get the response as plain text
                    console.error('Error response:', text);
                    alert(data.message);
                }
            } catch (error) {
                console.error('Error creating campaign:', error);
                alert("An error occurred while creating the campaign");
            }
        },
        async deleteCampaign(id) {
            if (!confirm("Are you sure you want to delete this campaign?")) return;

            try {
                const response = await fetch(`/api/campaigns/${id}`, {
                    method: 'DELETE',
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": this.token
                    },
                });

                const text = await response.text(); 

                if (response.ok) {
                    this.fetchUserCampaigns();
                    alert("Campaign deleted successfully!");
                } else {
                    const errorData = JSON.parse(text); 
                    console.error('Failed to delete campaign:', errorData);
                    alert("Failed to delete campaign. Please try again.");
                }
            } catch (error) {
                console.error('Error deleting campaign:', error);
                alert("An error occurred while deleting the campaign");
            }
        },
        resetForm() {
            this.newCampaign = {
                name: null,
                description: null,
                start_date: null,
                end_date: null,
                budget: null,
                visibility: true,
            };
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
                    this.userCampaigns = this.userCampaigns.map(campaign => 
                        campaign.id === id ? { ...campaign, status: 2 } : campaign
                    );
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
        editCampaign(id) {
            this.$router.push({ name: "UpdateCampaign", params: { id } });
        },
        sendAdRequest(id) {
            this.$router.push({ name: "SendAdRequest", params: { id } });
        },
        async downloadCSV() {
            try {
                const response = await fetch(`/api/export`, {
                    method: 'GET',
                    headers: {
                        "Authentication-Token": this.token,
                        "Role": this.role
                    },
                });
        
                if (response.ok) {
                    // Create a blob from the response
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
        
                    // Create a link element to trigger download
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'export-camp.csv';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
        
                    window.URL.revokeObjectURL(url); // Clean up the URL
                    alert("Downloaded CSV!");
                } else {
                    const errorData = await response.json();
                    console.error('Failed to Download CSV:', errorData);
                    alert("Failed to Download CSV. Please try again.");
                }
            } catch (error) {
                console.error('Error Downloading CSV:', error);
                alert("An error occurred while Downloading CSV");
            }
        }
    },
    computed: {
        statusLabels() {
            return {
                0: "Open",
                1: "In Progress",
                2: "Closed",
            };
        },
    },
    async created() {
        try {
            await this.fetchUserCampaigns();
        } catch (error) {
            console.error('Error during component creation:', error);
        }
    },
};
