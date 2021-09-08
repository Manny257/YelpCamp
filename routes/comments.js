var express     = require("express"),
    middleware  = require("../Middleware"),
    Comment     =require("../models/comment"),
    Campground  =require("../models/campground"),
    router      = express.Router({mergeParams:true});

//new
router.get("/new",middleware.isLoggedIn,function(req,res){
    Campground.findById(req.params.id,function(err,campground){
        if(err)
        console.log(err);
        else
            res.render("comments/new",{ campground:campground });
    });
});

//create
router.post("/",middleware.isLoggedIn,function(req,res){
    Campground.findById(req.params.id,function(err,campground){
        if(err)
        console.log("couldn't find campground");
        else{
            Comment.create(req.body.comment,function(err,comment){
                if(err){
                    req.flash("error", "Something went wrong");
                    console.log(err);
                }
                else{
                    comment.author.id=req.user._id;
                    comment.author.username=req.user.username;
                    comment.save();
                    campground.comments.push(comment);
                    campground.save();
                    res.redirect("/campgrounds/" + campground._id);
                }
            });
        }
    });
});

//edit
router.get("/:cid/edit",middleware.CheckCommentOwnership,function(req,res){
    Campground.findById(req.params.id,function(err,campground){
        if(err || !campground){
            req.flash("error","Campground not found !!");
            return res.redirect("/campgrounds");
        }
    Comment.findById(req.params.cid,function(err,comment){
        if(err)
        console.log(err);
        else
        res.render("comments/edit",{campground_id: req.params.id ,comment: comment});
    });   
  });
});

//update
router.put("/:cid",middleware.CheckCommentOwnership,function(req,res){
    Comment.findByIdAndUpdate(req.params.cid, req.body.comment, function(err,comment){
        if(err)
        console.log(err);
        else
        res.redirect("/campgrounds/"+req.params.id);
    });
});

//destroy
router.delete("/:cid",middleware.CheckCommentOwnership,function(req,res){
    Comment.findByIdAndRemove(req.params.cid, function(err){
        if(err)
        console.log(err);
        else{
            req.flash("error","Comment deleted ");
            res.redirect("/campgrounds/"+req.params.id);
        }
   });
});

module.exports=router;