const auth = require("../../middleware/auth")
const express = require("express")
const Profile = require("../../models/Profile")
const router = express.Router()
const User = require("../../models/User")

const { check, validationResult } = require("express-validator")

// @route   GET api/profile/me
// @desc    Get current user profile
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"])

    if (!profile) {
      return res.status(400).json({
        msg: "There is no profile for this user",
      })
    }

    res.json(profile)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
})

// @route   POST api/profile
// @desc    Create or update a user profile
// @access  Private
router.post(
  "/",
  [auth, [check("status", "Status is required").not().isEmpty(), check("skills", "Skills is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req)

    // Check for any errors
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // Pull everything from the request body
    const { company, website, location, bio, status, githubusername, skills, youtube, facebook, twitter, instagram, linkedin } = req.body

    // Build profile fields object for DB insertion
    const profileFields = {}
    profileFields.user = req.user.id

    // Check if the fields are coming in before we set them
    if (company) profileFields.company = company
    if (website) profileFields.website = website
    if (location) profileFields.location = location
    if (bio) profileFields.bio = bio
    if (status) profileFields.status = status
    if (githubusername) profileFields.githubusername = githubusername

    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim())
    }

    // Init the social object
    profileFields.social = {}

    // Check if the fields are coming in before we set them
    if (youtube) profileFields.social.youtube = youtube
    if (facebook) profileFields.social.facebook = facebook
    if (twitter) profileFields.social.twitter = twitter
    if (instagram) profileFields.social.instagram = instagram
    if (linkedin) profileFields.social.linkedin = linkedin

    try {
      // Look for the profile by the user
      let profile = await Profile.findOne({ user: req.user.id })

      // If the profile is found then update it
      if (profile) {
        profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true })
        return res.json(profile)
      }

      // If not found, create a new profile and save it
      profile = new Profile(profileFields)
      await profile.save()

      // Return the new profile
      res.json(profile)
    } catch (err) {
      console.error(err.message)
      res.status(500).send("Server Error")
    }
  }
)

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"])
    res.json(profiles)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
})

// @route   GET api/profile/user/:user_id
// @desc    Get profile by id
// @access  Public
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).populate("user", ["name", "avatar"])

    if (!profile) return res.status(400).json({ msg: "Profile not found" })

    res.json(profile)
  } catch (err) {
    console.error(err.message)

    // If we have object id error, the error should not be a server error
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found" })
    }

    res.status(500).send("Server Error")
  }
})

// @route   DELETE api/profile
// @desc    DELETE profile, user and posts
// @access  Private
router.delete("/", auth, async (req, res) => {
  try {
    // @todo - remove user posts

    // Remove profile
    // Remove user
    await Promise.all([Profile.findOneAndRemove({ user: req.user.id }), User.findOneAndRemove({ _id: req.user.id })])

    // Response message
    res.json({ msg: "User deleted" })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
})

module.exports = router
