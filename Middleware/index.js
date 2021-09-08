var  Campground  = require("../models/campground"),
     Comment     =require("../models/comment"),
     MiddlewareObj={};

MiddlewareObj.CheckCampgroundOwnership= function(req,res,next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id,function(err,campground){
            if(err || !campground){
            req.flash("error", "Campground not found !!");
            res.redirect("back");
            }
            else{
                if( campground.author.id.equals(req.user._id) || req.user.isAdmin )
                next();
                else{
                    req.flash("error","access denied");
                    res.redirect("back");
                }
            } 
        });
    }
    else
    req.flash("error","Please Log In first");
}

MiddlewareObj.CheckCommentOwnership= function(req,res,next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.cid,function(err,comment){
            if(err || !comment){
                req.flash("error","Comment not found !!");
                res.redirect("/campgrounds");
            }
            else{
                if( comment.author.id.equals(req.user._id) || req.user.isAdmin )
                next();
                else{
                    req.flash("error","Access Denied");
                    res.redirect("/campgrounds");
                }
            } 
        });
    }
    else{
        req.flash("error","Please Log In First");
        res.redirect("/campgrounds"); 
    }
}

MiddlewareObj.isLoggedIn= function(req,res,next){
    if(req.isAuthenticated())
    return next();
    req.flash("error","You need to be logged in to do that");
    res.redirect("/login");
}


module.exports= MiddlewareObj;