const jwt = require('jsonwebtoken');

exports.success = (req, res) => {
  const token = jwt.sign(
    { userId: req.user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(200).json({
    message: "Google Auth Success",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    },
    token
  });
};

exports.failure = (req, res) => {
  res.status(401).json({
    message: "Google Auth Failed"
  });
};
