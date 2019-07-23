const express   = require('express'),
      router    = express.Router()


router.get('/', (req, res) => {
    res.render('common/contact');
})

module.exports = router;