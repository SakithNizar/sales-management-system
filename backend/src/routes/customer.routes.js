const express = require("express");
const router = express.Router();

const {
  createCustomer,
  getCustomers,
  getCustomerPopupList,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerLedger,
  getSalesmanStats
} = require("../controllers/customer.controller");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management APIs (Admin & Salesman with route-based access)
 */

// =====================
// AUTH MIDDLEWARE
// =====================
router.use(protect);

// =====================
// CREATE CUSTOMER
// =====================
/**
 * @swagger
 * /customers:
 *   post:
 *     summary: "Create a new customer"
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - shopName
 *               - phoneNumber
 *               - address
 *               - route
 *             properties:
 *               customerName:
 *                 type: string
 *                 example: Nimal Perera
 *               shopName:
 *                 type: string
 *                 example: Nimal Stores
 *               phoneNumber:
 *                 type: string
 *                 example: "0771234567"
 *               whatsapp:
 *                 type: string
 *                 example: "0771234567"
 *               email:
 *                 type: string
 *                 example: nimal@gmail.com
 *               address:
 *                 type: string
 *                 example: Negombo Road
 *               location:
 *                 type: string
 *                 example: Negombo
 *               route:
 *                 type: string
 *                 example: "661abc123456"
 *               creditLimit:
 *                 type: number
 *                 example: 50000
 *               notes:
 *                 type: string
 *                 example: Regular customer
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post("/", createCustomer);

// =====================
// GET ALL CUSTOMERS
// =====================
/**
 * @swagger
 * /customers:
 *   get:
 *     summary: "Get customers (Admin: all, Salesman: only assigned routes)"
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: route
 *         schema:
 *           type: string
 *         description: Filter by route (Admin only)
 *     responses:
 *       200:
 *         description: List of customers
 *       401:
 *         description: Unauthorized
 */
router.get("/", getCustomers);

// =====================
// GET SALESMAN STATISTICS (DASHBOARD CARDS)
// =====================
/**
 * @swagger
 * /customers/salesman/stats:
 *   get:
 *     summary: "Get salesman dashboard statistics"
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns aggregated statistics for the logged-in salesman:
 *       - Total active customers in assigned routes
 *       - Total sales amount for current month
 *       - Total payments collected in current month
 *       - Total outstanding balance from all customers
 *     responses:
 *       200:
 *         description: "Statistics retrieved successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     myCustomersCount:
 *                       type: integer
 *                       example: 24
 *                       description: "Number of active customers in salesman's assigned routes"
 *                     thisMonthSales:
 *                       type: number
 *                       example: 185000
 *                       description: "Total sales amount (LKR) for current month from completed invoices"
 *                     collectedPayments:
 *                       type: number
 *                       example: 92500
 *                       description: "Total payments collected (LKR) in current month"
 *                     outstandingBalance:
 *                       type: number
 *                       example: 92500
 *                       description: "Total outstanding balance (LKR) from all customers in assigned routes"
 *       401:
 *         description: "Unauthorized - Invalid or missing token"
 *       403:
 *         description: "Forbidden - Access denied (requires admin or salesman role)"
 *       500:
 *         description: "Internal server error"
 */
router.get(
  "/salesman/stats",
  protect,
  restrictTo("admin", "salesman"),
  getSalesmanStats
);

/**
 * @swagger
 * /customers/popup/list:
 *   get:
 *     summary: "Get customer popup/dropdown list"
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns a lightweight customer list for dropdowns/popups.
 *       
 *       - Admin → Can see all customers
 *       - Salesman → Can only see customers in assigned routes
 *       
 *       Used in:
 *       - Sales module
 *       - Payment module
 *       - Return module
 *       - Mobile sales apps
 *     parameters:
 *       - in: query
 *         name: route
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter customers by route (Admin only)
 *     responses:
 *       200:
 *         description: Customer popup list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "681234abcd"
 *                   customerId:
 *                     type: string
 *                     example: "CUS-001"
 *                   customerName:
 *                     type: string
 *                     example: "Nimal Perera"
 *                   shopName:
 *                     type: string
 *                     example: "Nimal Stores"
 *                   displayName:
 *                     type: string
 *                     example: "Nimal Perera - Nimal Stores"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.get(
  "/popup/list",
  protect,
  restrictTo("admin", "salesman"),
  getCustomerPopupList
);

// =====================
// GET SINGLE CUSTOMER
// =====================
/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: "Get a single customer by ID"
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer data
 *       403:
 *         description: Access denied
 *       404:
 *         description: Customer not found
 */
router.get("/:id", getCustomer);

// =====================
// UPDATE CUSTOMER
// =====================
/**
 * @swagger
 * /customers/{id}:
 *   put:
 *     summary: "Update a customer"
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerName:
 *                 type: string
 *               shopName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               whatsapp:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               location:
 *                 type: string
 *               route:
 *                 type: string
 *               creditLimit:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Customer not found
 */
router.put("/:id", updateCustomer);

// =====================
// DELETE CUSTOMER
// =====================
/**
 * @swagger
 * /customers/{id}:
 *   delete:
 *     summary: "Delete a customer"
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Customer not found
 */
router.delete("/:id", deleteCustomer);


// =====================
// GET CUSTOMER LEDGER
// =====================
/**
 * @swagger
 * /customers/{id}/ledger:
 *   get:
 *     summary: Get full customer ledger (sales and payments)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer ledger retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customer:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     shopName:
 *                       type: string
 *                 ledger:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       type:
 *                         type: string
 *                         enum: [Sale, Payment]
 *                       reference:
 *                         type: string
 *                         example: INV-001
 *                       amount:
 *                         type: number
 *                         example: 5000
 *                       balance:
 *                         type: number
 *                         example: 3000
 *                 currentBalance:
 *                   type: number
 *                   example: 3000
 *       404:
 *         description: Customer not found
 */
router.get(
  "/:id/ledger",
  protect,
  restrictTo("admin", "salesman"),
  getCustomerLedger
);

module.exports = router;