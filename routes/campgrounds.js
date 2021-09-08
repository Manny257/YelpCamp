const { all } = require("async");

var express = require("express"),
    Campground = require("../models/campground"),
    Comment = require("../models/comment"),
    User = require("../models/user"),
    Notification = require("../models/notification"),
    middleware = require("../Middleware"),
    multer = require("multer"),
    cloudinary = require("cloudinary"),
    router = express.Router();

// image upload   
var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});

var imageFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error("Only image files are allowed"), false)
    }
    cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: imageFilter });

cloudinary.config({
    cloud_name: "dblebhz1u",
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
});

//index
router.get("/", function (req, res) {
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({ name: regex }, function (err, allcampgrounds) {
            if (err) {
                req.flash("error", "Something went wrong");
                res.redirect("/");
            }
            else {
                if (allcampgrounds.length < 1) {
                    res.render("campgrounds/Index", { error: "No match found", campgrounds: allcampgrounds });
                }
                else
                    res.render("campgrounds/Index", { campgrounds: allcampgrounds });
            }
        });
    }
    else {
        Campground.find({}, function (err, allcampgrounds) {
            if (err) {
                req.flash("error", "Something went wrong");
                res.redirect("/");
            }
            else {
                res.render("campgrounds/Index", { campgrounds: allcampgrounds });
            }
        });
    }
});

//new
router.get("/new", middleware.isLoggedIn, function (req, res) {
    res.render("campgrounds/new", {notifications: req.user.notifications.reverse()});
});

//create
router.post("/", middleware.isLoggedIn, upload.single("img"), function (req, res) {
    cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        // add cloudinary url and id for the image to the campground object under image property
        req.body.campground.img = result.secure_url;
        req.body.campground.imgId = result.public_id;
        // add author to campground
        req.body.campground.author = {
            id: req.user._id,
            username: req.user.username
        }
        Campground.create(req.body.campground, function (err, campground) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            User.findById(req.user._id).populate("followers").exec(function(err,user){
                if (err) {
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
                for(const follower of user.followers){
                    Notification.create({username: req.user.username, campgroundId: campground._id}, function(err, notification){
                        follower.notifications.push(notification);
                        follower.save();
                    });
                }
            });
            res.redirect("/campgrounds/" + campground._id);
        });
    });
});

//show
router.get("/:id", function (req, res) {
    Campground.findById(req.params.id).populate("comments").exec(function (err, foundCampground) {
        if (err || !foundCampground) {
            req.flash("error", "Campground not found");
            res.redirect("/campgrounds");
        }
        else
            res.render("campgrounds/show", { campground: foundCampground });
    });
});

//edit
router.get("/:id/edit", middleware.CheckCampgroundOwnership, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        res.render("campgrounds/edit", { campground: campground });
    });
});

//update
router.put("/:id", upload.single('img'), function(req, res){
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
              try {
                  await cloudinary.v2.uploader.destroy(campground.imgId);
                  var result = await cloudinary.v2.uploader.upload(req.file.path);
                  await campground.update({imgId:result.public_id, img:result.secure_url});
              } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});

//Destroy
router.delete("/:id", middleware.CheckCampgroundOwnership, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err){
            req.flash("error", "Somthing went Wrong");
            redirect("/campgrounds");
        }
        else {
            campground.comments.forEach(function (commentID) {
                Comment.findByIdAndRemove(commentID, function (err) {
                    if (err) {
                        req.flash("error", "Somthing went Wrong !");
                        redirect("/campgrounds/" + req.params.id);
                    }
                });
            });
            cloudinary.v2.uploader.destroy(campground.imgId);
        }
    });
    Campground.deleteOne({ _id: req.params.id }, function (err) {
        if (err) {
            req.flash("error", "Somthing went Wrong");
            redirect("/campgrounds");
        }
        else {
            req.flash("error", "Campground deleted");
            res.redirect("/campgrounds");

        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;