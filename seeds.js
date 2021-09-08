var mongoose    = require("mongoose"),
    Campground  =require("./models/campground"),
    Comment     =require("./models/comment");

var data=[
    { name: "Mountain view", 
      img: "https://images.unsplash.com/photo-1445308394109-4ec2920981b1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      description:"Amazing mountain view , combined with the extraordinary green areas.No bathrooms. No water provided"
    },
    { name: "Lake view", 
      img: "https://images.unsplash.com/photo-1526491109672-74740652b963?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
      description:"Calm place where you could relax and enjoy the view of lake sun and mountains all in one place."
    },
    { name: "Into the sunset", 
      img: "https://images.unsplash.com/photo-1502218808493-e5fd26249efc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
      description:"Let's ride off into the sunset"
    }

];

function seedDB(){
    Campground.deleteMany({},function(err){})
        // if(err)
        //  console.log(err);
    //     else{
    //         console.log("campgrounds deleted!");
    //         data.forEach(function(seed){
    //             Campground.create(seed,function(err,campground){
    //                 if(err)
    //                 console.log(err);
    //                 else{
    //                 console.log("campcround is added");
    //                 Comment.create({
    //                     text:"This place is awesome though wish to have internet",
    //                     author:"paul"
    //                 },
    //                 function(err,comment){
    //                     if(err)
    //                     console.log(err);
    //                     else{
    //                         campground.comments.push(comment);
    //                         campground.save();
    //                         console.log("new comment created");
    //                     }
    //                 }) 
    //                 }
    //             });
    //         });        
    //     }
    // });
    }

module.exports=seedDB;