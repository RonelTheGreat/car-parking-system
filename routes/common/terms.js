const express   = require('express'),
      router    = express.Router()

router.get('/', (req, res) => {
    res.render('terms');
})

module.exports = router;