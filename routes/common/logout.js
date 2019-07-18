const express   = require('express'),
      router    = express.Router()

// LOGOUT
router.get('/', (req, res) => {
    // destroy session and redirect to login page
    req.session.destroy(() => {
        res.redirect('/login');
    })
})

module.exports = router;