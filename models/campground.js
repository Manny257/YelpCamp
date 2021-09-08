var mongoose=require("mongoose");
var Comment =require("./comment");

var campgroundSchema= new mongoose.Schema({
    name:String,
    img: String,
    imgId: String,
    description: String,
    price: Number,
    createdAt: {
        type: Date , default: Date.now
    },
    author:{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username:String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

campgroundSchema.pre("findByIdAndRemove",function(next){
    this.comments.forEach(function(id){
        Comment.findByIdAndRemove(id,function(err){
            if(err)
            console.log("comments of campground couldn't be deleted");
        });    
    });
});

module.exports = mongoose.model("campground",campgroundSchema);
