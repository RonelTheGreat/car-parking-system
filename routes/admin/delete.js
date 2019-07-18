const express   = require('express'),
      router    = express.Router(),
      User      = require('../../models/User')


// DELETE USER
router.post('/delete', (req, res) => {

    User.findOneAndRemove({username: req.body.username}, (err, result) => {

        if (err) return res.json({msg: 'something went wrong deleting the user'});

        res.json({msg: 'user deleted successfully!'});
    })

})


module.exports = router;
