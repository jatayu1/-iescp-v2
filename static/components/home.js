import sponsorHome from "./sponsorhome.js"
import influencerHome from "./influencerhome.js"
import adminhome from "./adminhome.js"

export default {
    template : `<div>
    <sponsorHome v-if='userRole == "sponsor"' />
    <influencerHome v-if='userRole == "influencer"' />
    <adminhome v-if='userRole == "admin"' />
    </div>`,

    data() {
        return {
            userRole : localStorage.getItem('role'),
        }
    },

    components : {
        sponsorHome,
        influencerHome,
        adminhome,
    },
}