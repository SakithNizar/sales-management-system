const Route = require("../models/route.model");

// =====================
// CREATE ROUTE (WITH DUPLICATE CHECK)
// =====================
exports.createRoute = async (req, res, next) => {
  try {
    const { name, city } = req.body;

    if (!name || !city) {
      return res.status(400).json({
        message: "Name and city are required"
      });
    }

    // 🔍 Manual check before DB insert (better UX)
    const existingRoute = await Route.findOne({
      name: name.trim(),
      city: city.trim()
    });

    if (existingRoute) {
      return res.status(400).json({
        message: "Route already exists for this city"
      });
    }

    const route = await Route.create({
      name: name.trim(),
      city: city.trim()
    });

    res.status(201).json({
      message: "Route created successfully",
      route
    });

  } catch (err) {
    next(err);
  }
};

// =====================
// GET ALL ROUTES
// =====================
exports.getRoutes = async (req, res, next) => {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });

    res.status(200).json({
      count: routes.length,
      routes
    });
  } catch (err) {
    next(err);
  }
};

// =====================
// UPDATE ROUTE
// =====================
exports.updateRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, city } = req.body;

    const route = await Route.findById(id);

    if (!route) {
      return res.status(404).json({
        message: "Route not found"
      });
    }

    // 🔍 Prevent duplicate on update
    if (name || city) {
      const duplicate = await Route.findOne({
        _id: { $ne: id },
        name: name || route.name,
        city: city || route.city
      });

      if (duplicate) {
        return res.status(400).json({
          message: "Another route already exists with same name and city"
        });
      }
    }

    if (name) route.name = name.trim();
    if (city) route.city = city.trim();

    await route.save();

    res.status(200).json({
      message: "Route updated successfully",
      route
    });

  } catch (err) {
    next(err);
  }
};

// =====================
// DELETE ROUTE
// =====================
exports.deleteRoute = async (req, res, next) => {
  try {
    const { id } = req.params;

    const route = await Route.findById(id);

    if (!route) {
      return res.status(404).json({
        message: "Route not found"
      });
    }

    await route.deleteOne();

    res.status(200).json({
      message: "Route deleted successfully"
    });

  } catch (err) {
    next(err);
  }
};