export default {
    template: `
    <nav class="navbar navbar-expand-lg bg-body-tertiary" v-if="is_login">
        <div class="container-fluid">
            <a class="navbar-brand" href="#/">IESCPE</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse justify-content-end" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <router-link class="nav-link active" aria-current="page" to="/">Dashboard</router-link>
                    </li>

                    <!-- Campaign creation -->
                    <li class="nav-item" v-if="role === 'sponsor'">
                        <router-link class="nav-link" to="/create-campaign">Create Campaign</router-link>
                    </li>

                    <!-- Find Dropdown -->
                    <li class="nav-item dropdown" v-if="is_login">
                        <a class="nav-link dropdown-toggle" href="#" id="findDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            Find
                        </a>
                        <ul class="dropdown-menu" aria-labelledby="findDropdown">
                            <li><router-link class="dropdown-item" to="/find-influencer">Influencer</router-link></li>
                            <li><router-link class="dropdown-item" to="/find-sponsors">Sponsor</router-link></li>
                            <li><router-link class="dropdown-item" to="/find-campaign">Campaign</router-link></li>
                        </ul>
                    </li>

                    <!-- Stats for influencer and sponsor -->
                    <li class="nav-item" v-if="role === 'influencer' || role === 'sponsor'">
                        <router-link class="nav-link" to="/stats">Stats</router-link>
                    </li>

                    <!-- Profile Dropdown (hello, [username]) -->
                    <li class="nav-item dropdown" v-if="is_login">
                        <a class="nav-link dropdown-toggle" href="#" id="profileDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i>Hello, {{ username }}</i>
                        </a>
                        <ul class="dropdown-menu" aria-labelledby="profileDropdown">
                            <li v-if="role != 'admin'">
                                <router-link 
                                    class="dropdown-item" 
                                    :to="{ name: 'updateProfile', params: { id: id } }">
                                    Update Profile
                                </router-link>
                            </li>
                            <li><button class="dropdown-item" @click="logout">Logout</button></li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    `,
    data() {
        return {
            role: localStorage.getItem('role'),
            is_login: localStorage.getItem('auth-token'),
            username: '',
            id : null,
        };
    },
    methods: {
        async fetchUserInfo() {
            try {
                const response = await fetch('/api/current-user', {
                    method: 'GET',
                    headers: {
                    "Authentication-Token" : this.is_login
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    this.username = data.username;
                    this.id = data.id,
                    this.role = data.role;
                } else {
                    console.error('Failed to fetch user info');
                }
            } catch (error) {
            console.error('Error fetching user info:', error);
            }
        },
        logout() {
            localStorage.removeItem('auth-token');
            localStorage.removeItem('role');
            this.$router.push({ path: '/login' });
        },
    },
    async created() {
        try {
            await this.fetchUserInfo();
        } catch (error) {
            console.error('Error during component creation:', error);
        }
    },
}
