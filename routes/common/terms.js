const express   = require('express'),
      router    = express.Router()

router.get('/', (req, res) => {
    res.render('common/terms');
})

module.exports = router;