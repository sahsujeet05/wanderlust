const Listing = require("../models/listing");
const axios = require("axios");

module.exports.index = async(req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings }); 
};


module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};


module.exports.showListing = async (req, res) => {
        let {id} = req.params;
        const listing = await Listing.findById(id)
            .populate({
                path:"reviews", 
                populate:{
                    path:"author",
                },
            })
            .populate("owner");
        if(!listing){
            req.flash("error", " Listing you requested for does not exit!");
            res.redirect("/listings");
        }
        console.log(listing);
        res.render("listings/show.ejs", {listing});
    };

    // module.exports.createListing = async (req, res,next) => {
    //         let url = req.file.path;
    //         let filename = req.file.filename;

    //         const newListing = new Listing(req.body.listing);
    //         newListing.owner = req.user._id;
    //         newListing.image = { url, filename };
    //         await newListing.save();
    //         req.flash("success", "New Listing Created!");
    //         res.redirect("/listings");
    // };
//i took from chatGPT
    module.exports.createListing = async (req, res) => {
    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.category = req.body.listing.category;
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    // 🔥 GEOCODING START
    let location = req.body.listing.location;

    const geoRes = await axios.get(
    `https://nominatim.openstreetmap.org/search?format=json&q=${location}`,
    {
        headers: {
            "User-Agent": "wanderlust-app"
        }
    }
);

    if (geoRes.data.length > 0) {
        newListing.geometry = {
            type: "Point",
            coordinates: [
                parseFloat(geoRes.data[0].lon),
                parseFloat(geoRes.data[0].lat)
            ]
        };
    } else {
        req.flash("error", "Invalid location!");
        return res.redirect("/listings/new");
    }
    // 🔥 GEOCODING END

    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};


module.exports.renderEditForm = async(req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", " Listing you requested for does not exit!");
       res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// module.exports.updateListing = async (req, res) =>{
//     let {id} = req.params;
//     let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});

//     if(typeof req.file !== "undefined"){
//         let url = req.file.path;
//         let filename = req.file.filename;
//         listing.image = {url,  filename};
//         await listing.save();
//     }
    
//     req.flash("success", " Listing Updated!");
//     res.redirect(`/listings/${id}`);
// };


//chatGPT i took
module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    // 🔥 GEOCODING (NEW ADD)
    if (req.body.listing.location) {
        const geoRes = await axios.get(
            `https://nominatim.openstreetmap.org/search?format=json&q=${req.body.listing.location}`,
            {
                headers: {
                    "User-Agent": "wanderlust-app"
                }
            }
        );

        if (geoRes.data.length > 0) {
            listing.geometry = {
                type: "Point",
                coordinates: [
                    parseFloat(geoRes.data[0].lon),
                    parseFloat(geoRes.data[0].lat)
                ]
            };
        }
    }

    // 📸 image update
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
    }

    await listing.save();

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};


module.exports.destroyListing = async (req, res) => {
        let {id} = req.params;
        let deletedListing = await Listing.findByIdAndDelete(id);
        console.log(deletedListing);
        req.flash("success", "New Listing Deleted!");
        res.redirect("/listings");

    };