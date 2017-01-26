module.exports = {

    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"],

    getDifference: function(date){
        date = new Date(date);
        
        var seconds = Math.floor((new Date() - date) / 1000);
        var interval = Math.floor(seconds / 3600);

        if (interval > 23) {
            return date.getDate()+" "+this.month[date.getMonth()]+" "+date.getFullYear();
        }
        if (interval >= 1) {
            return interval + " hrs ago";
        }
        interval = seconds / 60;
        if (interval > 1) {
            return Math.floor(interval) + " min" + (interval > 1 ? "s" : "") + " ago";
        }
        if (interval > 0.1) {
            return "less than 1 min ago";
        }
        return "just now";
    },

    getStamp: function(date){
        date = new Date(date);
        console.log(date);
        return date.getHours()+":"+date.getMinutes()+" "+date.getDate()+" "+this.month[date.getMonth()]+" "+date.getFullYear(); 
    },

    html: function(date){
        return "<time title='"+this.getStamp(date)+"'>"+this.getDifference(date)+"</time>";
    }
    
}
