import Home from './components/home.js'
import Login from './components/login.js'
import Users from './components/users.js'
import Register from './components/register.js'
import createCampaign from './components/createcampaign.js'
import updateCampaign from "./components/updateCampaign.js";
import SendAdRequest from "./components/SendAdRequest.js";
import negotiate from "./components/negotiate.js";
import editRequests from './components/edit-requests.js'
import findInfluencer from './components/find-influencer.js'
import findSponsors from './components/find-sponsors.js'
import findCampaign from './components/find-campaign.js'
import viewCampaign from './components/view-campaign.js'
import updateProfile from './components/update-profile.js'
import stats from './components/stats.js'

const routes = [
    { 
        path : "/",
        component : Home
    },
    { 
        path : "/login",
        component : Login,
        name : 'Login'
    },
    { 
        path : "/register",
        component : Register,
        name : 'Register'
    },
    { 
        path: '/users', 
        component: Users 
    },
    { 
        path: '/create-campaign', 
        component: createCampaign 
    },
    { 
        path: "/update-campaign/:id", 
        component: updateCampaign, 
        name: "UpdateCampaign" 
    },
    {
        path: "/send-ad-request/:id",
        component: SendAdRequest,
        name: "SendAdRequest",
    },
    {
        path: "/negotiate/:id",
        component: negotiate,
        name: "negotiate",
    },
    {
        path: "/edit-request/:id",
        component: editRequests,
        name: "editRequests",
    },
    {
        path: "/find-influencer",
        component: findInfluencer,
        name: "findInfluencer",
    },
    {
        path: "/find-sponsors",
        component: findSponsors,
        name: "findSponsors",
    },
    {
        path: "/find-campaign",
        component: findCampaign,
        name: "findCampaign",
    },
    {
        path: "/view-campaign/:id",
        component: viewCampaign,
        name: "viewCampaign",
    },
    {
        path: "/update-profile/:id",
        component: updateProfile,
        name: "updateProfile",
    },
    {
        path: "/stats",
        component: stats,
        name: "stats",
    }
]

export default new VueRouter({
    routes
})