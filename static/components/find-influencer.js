export default {
    template: `
    <div class="send-ad-request">
        <div class="search-bar">
            <div class="search-container">
                <select v-model="searchColumn" class="search-dropdown">
                    <option value="fullname">Full Name</option>
                    <option value="email">Email</option>
                    <option value="username">Username</option>
                    <option value="category">Category</option>
                    <option value="niche">Niche</option>
                </select>
                <input
                    type="text"
                    class="search-input"
                    placeholder="Search..."
                    v-model="searchQuery"
                    @input="filterSponsor"
                />
                <i class="fas fa-search search-icon"></i>
            </div>
        </div>

        <div v-if="filteredSponsors.length" class="influencer-selection">
            <div class="container">
                <div class="card influencer-selection-card">
                    <div class="card-header bg-info text-white text-center">
                        <h3>Find Influencer</h3>
                    </div>
                    <div class="card-body">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Full Name</th>
                                    <th>Email</th>
                                    <th>Username</th>
                                    <th>Category</th>
                                    <th>Niche</th>
                                    <th>Flag</th>
                                    <th v-if="role == 'admin'">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="sponsor in filteredSponsors" :key="sponsor.user_id">
                                    <td>{{ sponsor.fullname }}</td>
                                    <td>{{ sponsor.email }}</td>
                                    <td>{{ sponsor.username }}</td>
                                    <td>{{ sponsor.category }}</td>
                                    <td>{{ sponsor.niche }}</td>
                                    <td>{{ sponsor.flag }}</td>
                                    <td v-if="role == 'admin'">
                                        <button class="btn btn-success btn-sm" @click="Flag(sponsor.user_id)" v-if="sponsor.flag == 0">Flag</button>
                                        <button class="btn btn-success btn-sm" @click="Unflag(sponsor.user_id)" v-if="sponsor.flag == 1">Unflag</button>
                                        <button class="btn btn-danger btn-sm" @click="Delete(sponsor.user_id)">Delete</button>
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
            searchColumn: "fullname",
            sponsors: [],
            filteredSponsors: [],
            token: localStorage.getItem("auth-token"),
            role: localStorage.getItem("role"),
        };
    },
    methods: {
        async fetchSponsor() {
            try {
                const sponsorResponse = await fetch("/api/influencer-details", {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": this.token,
                    },
                });

                const sponsorData = await sponsorResponse.json();

                if (sponsorResponse.ok) {   
                    this.sponsors = this.filteredSponsors = sponsorData;
                } else {
                    console.log(sponsorData);
                    alert("An error occurred while fetching sponsors.");
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                alert("An error occurred while fetching sponsors.");
            }
        },
        filterSponsor() {
            const query = this.searchQuery.toLowerCase();
            if (!query) {
                this.filteredSponsors = this.sponsors; // Reset to all sponsors
                return;
            }

            this.filteredSponsors = this.sponsors.filter(sponsor => {
                const value = sponsor[this.searchColumn]?.toString().toLowerCase() || "";
                return value.includes(query);
            });
        },
        async Flag(uid){
            const response = await fetch(`/api/flag-user`, {
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
                alert("User Flagged")
                this.fetchSponsor()
            }else {
                alert("error in Flagging")
                console.log(data)
            }
        },
        async Unflag(uid){
            const response = await fetch(`/api/unflag-user`, {
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
                alert("User Unflagged")
                this.fetchSponsor()
            }else {
                alert("error in Unflagging")
                console.log(data)
            }
        },
        async Delete(uid){
            const response = await fetch(`/api/delete-user`, {
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
                alert("User deleted")
                this.fetchSponsor()
            }else {
                alert("error in deletion")
                console.log(data)
            }
        }
    },
    async created() {
        try {
            await this.fetchSponsor();
        } catch (error) {
            console.error("Error during component creation:", error);
        }
    },
};
