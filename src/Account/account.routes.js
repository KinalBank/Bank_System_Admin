import { Router } from "express";
import { validateCreateAccount } from "../../middlewares/account.validator.js"; 
import { 
    createAccount, 
    getAccounts, 
    changeAccountStatus, 
    getAccountsByMovements, 
    getAccountDetailsAndTop5 
} from "./account.controller.js";
import { validateJWT, hasRole } from "../../middlewares/validate-jwt.js";

const router = Router();

router.get('/movements/ranking', validateJWT, hasRole('ADMIN'), getAccountsByMovements);
router.get('/:id/details', validateJWT, hasRole('ADMIN'), getAccountDetailsAndTop5);

router.post('/', validateJWT, hasRole('ADMIN'), validateCreateAccount, createAccount);
router.get('/', validateJWT, getAccounts);
router.put('/:id/status', validateJWT, hasRole('ADMIN'), changeAccountStatus);

export default router;