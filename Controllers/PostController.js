const { v4: uuid } = require("uuid");
const PostModel = require("../Models/Post");
const fs = require('fs');
const ProfileImage = require("../Models/ProfileImage");
const createPost = (req, res) => {
    const { text, type } = req.body
    const userId = req.params.id;
    const imageRequest = req.files?.media;
    if (!imageRequest && !text) {
        return res.status(400).json({
            success: 'Bad request...No data available',
            data: null
        });
    }
    let path = '';

    if (imageRequest) {
        const imageUuid = uuid();
        const url = `${userId}_${imageUuid}`;
        const splittedFileName = imageRequest.name.split('.');
        const mediaExtension = imageRequest.name.split('.')[splittedFileName.length - 1];
        path = `public/posts/${url}.${mediaExtension}`;
        imageRequest.mv(path, () => {
        });
    }

    const payload = {
        mediaUrl: path,
        text,
        postType: type,
        userId
    }
    const newPost = new PostModel(payload);
    newPost.save().then((newPostResponse) => {
        if (newPostResponse) {
            return res.status(200).json({
                success: 'Post created successfully',
                data: newPostResponse
            });
        } else {
            try {
                fs.unlinkSync(path);
                return res.status(400).json({
                    success: 'Post created failed',
                    data: null
                });
            } catch (e) {
                console.log("Image deletion failed");
            }

        }
    }).catch((e) => {
        return res.status(500).json({
            success: 'Something went wrong..Please try again..!',
            data: null
        });
    })
}


const updatePost = (req, res) => {
    const postId = req.params.postId;
    PostModel.findByIdAndUpdate(postId, { text: req.body.text }).exec().then((postUpdated) => {
        if (postUpdated) {
            return res.status(200).json({
                success: "Posted updated successfully",
                data: postUpdated
            });
        } else {
            return res.status(400).json({
                success: "Posted updation failed",
                data: null
            });
        }
    }).catch((e) => {
        console.log(e);
        return res.status(400).json({
            success: "Something went wrong..Please try again later...!",
            data: null
        });
    })
}


const getPostById = (req, res) => {
    postId = req.params.id;
    PostModel.findOne({ userId: postId }).exec().then((getPostById) => {
        if (getPostById) {
            return res.status(200).json({
                success: "",
                data: getPostById
            });
        } else {
            return res.status(400).json({
                success: "Post not available",
                data: null
            });
        }
    }).catch((e) => {
        return res.status(500).json({
            success: "Something went wrong..Please try again later...!",
            data: null
        });
    })
}

const getAllPosts = (req, res) => {
    id = req.params.id;
    Promise.all([PostModel.find({ userId: id }).populate([
        {
            path: 'userId',
            select: '-password'
        },
    ]), ProfileImage.findOne({ userId: id })]).then(([getAllPosts, imageData]) => {
        if (getAllPosts) {
            return res.status(200).json({
                success: "",
                data: { posts: getAllPosts, imageUrl: imageData?.imageUrl }
            });
        } else {
            return res.status(400).json({
                success: "No post available",
                data: null
            });
        }
    }).catch((e) => {
        return res.status(500).json({
            success: "Something went wrong..Please try again later...!",
            data: null
        });
    })
}

const deletePost = (req, res) => {
    postId = req.params.postId
    PostModel.findByIdAndDelete(postId).exec().then((deletedPost) => {
        if (deletedPost) {
            try {
                fs.unlinkSync(deletedPost.mediaUrl)
            } catch {
                console.log("Deletion failed");
            }
            return res.status(200).json({
                success: "Post deletion successfully",
                data: deletedPost
            });
        } else {
            return res.status(400).json({
                success: "Post deletion failed",
                data: null
            });
        }
    }).catch((e) => {
        return res.status(400).json({
            success: "Something went wrong..Please try again later...!",
            data: null
        });
    })
}

const getAllPostsForAllUsers = (req, res) => {
    PostModel.aggregate([
        {
            $lookup: {
                from: 'users',               // Name of the 'users' collection
                localField: 'userId',         // Field in PostModel
                foreignField: '_id',          // Field in Users collection
                as: 'userDetails'             // Output array field for matched user documents
            }
        },
        {
            $lookup: {
                from: 'profileimages',        // Name of the 'profileimages' collection
                localField: 'userId',         // Field in PostModel
                foreignField: 'userId',       // Field in ProfileImage collection
                as: 'profileImageDetails'     // Output array field for matched profile images
            }
        },
        {
            $lookup: {
                from: 'profiles',        // Name of the 'profileimages' collection
                localField: 'userId',         // Field in PostModel
                foreignField: 'userId',       // Field in ProfileImage collection
                as: 'profileDetails'     // Output array field for matched profile images
            }
        },
        {
            $unwind: {
                path: '$userDetails',         // Flatten the user details array
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: '$profileImageDetails', // Flatten the profile image details array
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: '$profileDetails', // Flatten the profile image details array
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                mediaUrl: 1,
                text: 1,
                postType: 1,
                createdDate: 1,
                updatedDate: 1,
                isActive: '$profileDetails.openToCollab',
                'userDetails.firstName': 1,
                'userDetails.lastName': 1,
                'userDetails.userName': 1,
                'userDetails.email': 1,
                'userDetails.type': 1,
                'userId': 1,
                profileImageUrl: '$profileImageDetails.imageUrl'  // Rename field for simplicity
            }
        }
    ])
    .then(posts => {
        if (posts) {
            return res.status(200).json({
                success: "Successfully fetched",
                data: posts
            });
        } else {
            return res.status(404).json({
                success: "Not able to get the posts. Please try again",
                data: null
            });
        }
        
    })
    .catch(err => {
        return res.status(500).json({
            success: 'Something went wrong..Please try again..!',
            data: posts
        });
    });
    
}

module.exports = {
    createPost,
    updatePost,
    deletePost,
    getPostById,
    getAllPosts,
    getAllPostsForAllUsers
}