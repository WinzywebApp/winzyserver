import express from "express"
import getUserProfile, { usercreat,userfinde,userdelete, userlogin, } from "../controlers/usercontroler.js";

const userRout = express.Router();

    userRout.post('/creat',usercreat);
    userRout.post('/login',userlogin)

    userRout.get('/',userfinde);
    userRout.delete('/:name',userdelete);
    userRout.get('/profile',getUserProfile)

   

    export default userRout;