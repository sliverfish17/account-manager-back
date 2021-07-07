const Role = require("./models/Role");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { secret } = require("./config");

const generateAccessToken = (id, roles) => {
  const payload = {
    id,
    roles,
  };
  return jwt.sign(payload, secret, { expiresIn: "24h" });
};

class authController {
  async registration(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Registration error", errors });
      }
      const { username, password, email } = req.body;
      const candidate = await User.findOne({ username });
      if (candidate) {
        return res
          .status(400)
          .json({ message: "User with such name already exists" });
      }
      const hashPassword = bcrypt.hashSync(password, 6);
      const userRole = await Role.findOne({ value: "USER" });

      const user = new User({
        username,
        email,
        password: hashPassword,
        roles: userRole.value,
      });

      await user.save();
      return res.json({ message: "User was registered" });
    } catch (event) {
      console.log(event);
      res.status(400).json({ message: "Registration error" });
    }
  }
  async login(req, res) {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });
      if (!user) {
        return res
          .status(400)
          .json({ message: `User ${username} was not found` });
      }
      const validPassword = bcrypt.compareSync(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: `Wrong password` });
      }
      const token = generateAccessToken(user._id, user.roles);
      return res.json({ token });
    } catch (event) {
      console.log(event);
      res.status(400).json({ message: "Login error" });
    }
  }
  async getUsers(req, res) {
    try {
      const users = await User.find();
      res.json(users);
    } catch (event) {
      console.log(event);
    }
  }
}

module.exports = new authController();
