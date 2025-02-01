export default {
    template: `
    <div class="send-ad-request">
        <div class="search-bar">
            <div class="search-container">
                <select v-model="searchColumn" class="search-dropdown">
                    <option value="name">Name</option>
                    <option value="start_date">Start Date</option>
                    <option value="end_date">End Date</option>
                    <option value="budget">Budget</option>
                    <option value="visibility" v-if="role === 'admin'">Visibility</option>
                    <option value="status">Status</option>
                    <option value="flagged">Flagged</option>
                    <option value="created_by">Sponsored By</option>
                    <option value="assigned_to">Assigned To</option>
                </select>

                <template v-if="searchColumn === 'start_date' || searchColumn === 'end_date'">
                    <input
                        type="date"
                        class="search-input"
                        v-model="searchQuery"
                        @input="filterSponsor"
                    />
                </template>

                <template v-else-if="searchColumn === 'status'">
                    <select v-model="searchQuery" class="search-input" @change="filterSponsor">
                        <option value="">All Statuses</option>
                        <option v-for="(label, key) in statusLabels" :key="key" :value="key">
                            {{ label }}
                        </option>
                    </select>
                </template>

                <template v-else-if="searchColumn === 'visibility'">
                    <select v-model="searchQuery" class="search-input" @change="filterSponsor">
                        <option value="">All Visibility</option>
                        <option value="true">Public</option>
                        <option value="false">Private</option>
                    </select>
                </template>

                <template v-else-if="searchColumn === 'created_by' || searchColumn === 'assigned_to'">
                    <select v-model="searchQuery" class="search-input" @change="filterSponsor">
                        <option value="">All Users</option>
                        <option v-for="(name, id) in userMap" :key="id" :value="id">
                            {{ name }}
                        </option>
                        <option value="na">N/A</option>
                    </select>
                </template>

                <template v-else>
                    <input
                        type="text"
                        class="search-input"
                        placeholder="Search..."
                        v-model="searchQuery"
                        @input="filterSponsor"
                    />
                </template>
                <i class="fas fa-search search-icon"></i>
            </div>
        </div>

        <div v-if="filteredSponsors.length" class="influencer-selection">
            <div class="container">
                <div class="card influencer-selection-card">
                    <div class="card-header bg-info text-white text-center">
                        <h3>Find Campaigns</h3>
                    </div>
                    <div class="card-body">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Budget</th>
                                    <th v-if="role === 'admin'">Visibility</th>
                                    <th>Status</th>
                                    <th>Flag</th>
                                    <th>Created By</th>
                                    <th>Assigned To</th>
                                    <th v-if="role == 'admin'">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="campaign in filteredSponsors" :key="campaign.id">
                                    <td>
                                        <router-link 
                                            class="dropdown-item" 
                                            :to="{ name: 'viewCampaign', params: { id: campaign.id } }">
                                            {{ campaign.name }}
                                        </router-link>
                                    </td>
                                    <td>{{ campaign.start_date }}</td>
                                    <td>{{ campaign.end_date }}</td>
                                    <td>{{ campaign.budget }}</td>
                                    <td v-if="role === 'admin'">{{ campaign.visibility ? "Public" : "Private" }}</td>
                                    <td>{{ statusLabels[campaign.status] }}</td>
                                    <td>{{ campaign.flagged }}</td>
                                    <td>{{ userMap[campaign.created_by] || "N/A" }}</td>
                                    <td>{{ userMap[campaign.assigned_to] || "N/A" }}</td>
                                    <td v-if="role == 'admin'">
                                        <button class="btn btn-success btn-sm" @click="Flag(campaign.id)" v-if="campaign.flagged == 0">Flag</button>
                                        <button class="btn btn-success btn-sm" @click="Unflag(campaign.id)" v-if="campaign.flagged == 1">Unflag</button>
                                        <button class="btn btn-danger btn-sm" @click="Delete(campaign.id)">Delete</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="no-influencers">
            <i class="fas fa-user-slash no-influencers-icon"></i>
            <p class="no-influencers-text">No sponsor found. Please try again later!</p>
        </div>
    </div>
    `,
    data() {
        return {
            searchQuery: "",
            searchColumn: "name",
            sponsors: [],
            filteredSponsors: [],
            userMap: {}, // Map to store user ID to fullname (username)
            token: localStorage.getItem("auth-token"),
            role: localStorage.getItem("role"),
            statusLabels: {
                0: "Not Started",
                1: "In Progress",
                2: "Closed",
            },
        };
    },
    methods: {
        async fetchSponsor() {
            try {
                const sponsorResponse = await fetch("/api/campaigns", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": this.token,
                    },
                });

                const sponsorData = await sponsorResponse.json();

                if (sponsorResponse.ok) {
                    this.sponsors = this.role !== "admin"
                        ? sponsorData.filter((campaign) => campaign.visibility !== false)
                        : sponsorData;
                    this.filteredSponsors = this.sponsors;
                } else {
                    alert("An error occurred while fetching sponsors.");
                }
            } catch (error) {
                alert("An error occurred while fetching sponsors.");
            }
        },
        async fetchUsers() {
            try {
                const userResponse = await fetch("/api/users", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": this.token,
                    },
                });

                const users = await userResponse.json();

                if (userResponse.ok) {
                    this.userMap = users.reduce((map, user) => {
                        map[user.id] = `${user.fullname} (${user.username})`;
                        return map;
                    }, {});
                } else {
                    console.log(users);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        },
        filterSponsor() {
            const query = this.searchQuery;
            const column = this.searchColumn;
        
            if (!query && column !== "visibility" && column !== "status") {
                this.filteredSponsors = this.sponsors;
                return;
            }
        
            this.filteredSponsors = this.sponsors.filter((campaign) => {
                if (column === "created_by" || column === "assigned_to") {
                    if (query === "na") {
                        // Show campaigns where the field is null or undefined
                        return !campaign[column];
                    } else {
                        // Convert query to a number for comparison
                        return campaign[column] === Number(query);
                    }
                }
        
                const value = campaign[column]?.toString().toLowerCase() || "";
        
                if (column === "start_date" || column === "end_date") {
                    return campaign[column] === query;
                } else if (column === "status" || column === "visibility") {
                    return campaign[column]?.toString() === query;
                } else {
                    return value.includes(query.toLowerCase());
                }
            });
        },
        async Flag(cid){
            const response = await fetch(`/api/flag-campaign`, {
                method: 'put',
                headers: {
                    "Content-Type" : "application/json",
                    "Authentication-Token": this.token,
                    "Role":this.role,
                },
                body: JSON.stringify({
                    cid: cid,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                alert("Campaign Flagged")
                this.fetchSponsor()
            }else {
                alert("error in Flagging")
                console.log(data)
            }
        },
        async Unflag(cid){
            const response = await fetch(`/api/unflag-campaign`, {
                method: 'put',
                headers: {
                    "Content-Type" : "application/json",
                    "Authentication-Token": this.token,
                    "Role":this.role,
                },
                body: JSON.stringify({
                    cid: cid,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                alert("Campaign Unflagged")
                this.fetchSponsor()
            }else {
                alert("error in Unflagging")
                console.log(data)
            }
        },
        async Delete(cid){
            const response = await fetch(`/api/campaigns/${cid}`, {
                method: 'delete',
                headers: {
                    "Content-Type" : "application/json",
                    "Authentication-Token": this.token,
                    "Role":this.role,
                },
            });

            const data = await response.json();
            if (response.ok) {
                alert("campaign deleted")
                this.fetchSponsor()
            }else {
                alert("error in deletion")
                console.log(data)
            }
        }
    },
    async created() {
        await this.fetchUsers();
        await this.fetchSponsor();
    },
};
