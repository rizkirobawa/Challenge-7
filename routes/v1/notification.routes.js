const router = require('express').Router();
const {
  createNotification,
  getAllNotification,
} = require('../../controllers/notification.controller');

router.post('/notification/:user_id', createNotification);
router.get('/notif/notification', getAllNotification);

module.exports = router;
