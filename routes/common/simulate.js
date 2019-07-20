const express   = require('express'),
      router    = express.Router()

// SIMULATOR
router.get('/', (req, res) => {
    res.render('common/simulate');
})

module.exports = router;