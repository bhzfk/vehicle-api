
var express = require("express"), path = require("path"), bodyParser = require("body-parser"), app = express(),
    nodemailer = require("nodemailer"), expressValidator = require("express-validator");

const fileUpload = require("express-fileupload");
const morgan = require("morgan");
//const _ = require('lodash');

// enable files upload
app.use(fileUpload({
    createParentPath: true,
}));

//var multiparty = require('multiparty');
//const multipart = require('connect-multiparty');
//const multipartMiddleware = multipart({ maxFieldsSize: (20 * 1024 * 1024) });

const cors = require("cors");

const crypto = require("crypto");

/*Set EJS template Engine*/

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({extended: true})); //support x-www-form-urlencoded
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(expressValidator());
//app.use(express.json());

//add other middleware
app.use(cors());
app.use(morgan("dev"));

var local = false;

/*MySql connection*/
var connection = require("express-myconnection"), mysql = require("mysql");

if (local) {
    console.log("local");
    var con = mysql.createConnection({
        host: "localhost", user: "root", password: "root", database: "car",
    });

    app.use(connection(mysql, {
        host: "localhost", user: "root", password: "root", database: "car", debug: false, //set true if you wanna see debug logger
    }, "request"));
} else {
    app.use(connection(mysql, {
        host: "127.0.0.1", user: "fahrzeug_db", password: "rzBTJ6tfe", database: "fahrzeug_db", debug: false, //set true if you wanna see debug logger
    }, "request"));
}

//RESTful route
var router = express.Router();

//router.use(multipartMiddleware);

/*------------------------------------------------------
*  This is router middleware,invoked everytime
*  we hit url /api and anything after /api
*  like /api/user , /api/user/7
*  we can use this for doing validation,authetication
*  for every route started with /api
--------------------------------------------------------*/
router.use(function (req, res, next) {
    console.log(req.method, req.url);
    next();
});

// Route Middlewares
app.use("/", cors(), router);

var login = router.route("/api/login");
login.post(function (req, res, next) {
    let token = "";
    let userName = req.body.username;
    let passWord = req.body.password;

    debugger;

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        let queryText = `select * from users where userName = '${userName}'`;

        var query = conn.query(queryText, function (err, results) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            if (results[0] != null) {
                if (passWord == results[0].password) {
                    if (results[0].role == "owner") {
                        token = generateId(50);

                        queryText = `UPDATE users SET token = '${token}' WHERE id = ${results[0].id}`;
                        var query = conn.query(queryText, function (err, results) {
                            if (err) {
                                console.log(err);
                                return next("Mysql error, check your query");
                            }
                        });

                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify({
                            state: true, message: "Successfully Login", token: token,
                        }));

                        console.log("Successfully Login");
                    } else {
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify({
                            state: false, message: "Not Access To This Area", token: "",
                        }));

                        console.log("Not Access");
                    }
                } else {
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify({
                        state: false, message: "mistakePassword", token: "",
                    }));

                    console.log("mistakePassword");
                }
            } else {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({state: false, message: "notFoundUser", token: ""}));

                console.log("notFoundUser");
            }
        });
    });
});

var ulogin = router.route("/api/ulogin");
ulogin.post(function (req, res, next) {
    let token = "";
    let userName = req.body.username;
    let passWord = req.body.password;

    debugger;

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        let queryText = `select * from users where userName = '${userName}'`;

        var query = conn.query(queryText, function (err, results) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            if (results[0] != null) {
                if (passWord == results[0].password) {
                    token = generateId(20);

                    switch (results[0].role) {
                        case "owner":
                            token = "wox" + token;
                            break;
                        case "sale":
                            token = "asx" + token;
                            break;
                        case "max":
                            token = "1sx" + token;
                            break;
                        case "workshop":
                            token = "pox" + token;
                            break;
                        case "preparation":
                            token = "per" + token;
                            break;
                        case "workshop_user":
                            token = "wor" + token;
                            break;
                        case "spare":
                            token = "spa" + token;
                            break;
                    }

                    console.log(results[0].role);

                    console.log(token);

                    queryText = `UPDATE users SET token = '${token}' WHERE id = ${results[0].id}`;
                    var query = conn.query(queryText, function (err, results) {
                        if (err) {
                            console.log(err);
                            return next("Mysql error, check your query");
                        }
                    });

                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify({
                        state: true, message: "Successfully Login", token: token,
                    }));

                    console.log("Successfully Login");
                } else {
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify({
                        state: false, message: "mistakePassword", token: "",
                    }));

                    console.log("mistakePassword");
                }
            } else {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({state: false, message: "notFoundUser", token: ""}));

                console.log("notFoundUser");
            }
        });
    });
});

var vehicle = router.route("/api/vehicle/:status?");
vehicle.post(function (req, res, next) {
    console.log("init");
    let userId = 0;
    let userToken = req.body.token;
    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");
        let date_ob = new Date();
        console.log(date_ob);
        var query = conn.query("select * from setting", function (err, results) {
            //let userId = getUser(req.body.token)[0].id;
            // userId = dataVal.data.id;

            //get data
            var data = {
                brandId: parseInt(req.body.brandSelect),
                modelId: parseInt(req.body.modelSelect),
                categoryId: parseInt(req.body.categorySelect),
                purchaseDate: req.body.purchaseDate,
                firstRegisteration: req.body.firstRegisteration,
                constructionDate: req.body.constructionDate, // customerName: req.body.customerName,
                contractor: req.body.contractor,
                purchasePrice: parseFloat(String(req.body.purchasePrice).replace(",", "")),
                identificationNumber: req.body.identificationNumber,
                status: "INCOMING",
                inevtoryCost: results[0].inevtoryCost,
                processingCost: results[0].processingCost,
                InventoryRate: results[0].inevtoryCost,
                ProcessingRate: results[0].processingCost,
                WorkShopRate: results[0].WorkShopCost,
                PreparationRate: results[0].preparationCost,
                StandRate: results[0].standCosts, // creatorId: userId
            };

            var query = conn.query("INSERT INTO vehicle set ? ", data, function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                if (req.files != null) {
                    req.getConnection(function (err, conn) {
                        if (err) return next("Cannot Connect");

                        debugger;

                        if (Array.isArray(req.files["photos[]"])) {
                            let data = [];

                            //loop all files
                            req.files["photos[]"].map((photo) => {
                                //let photo = req.files.photos[key];

                                fileName = require("crypto").randomBytes(16).toString("hex");
                                fileName += String(new Date().getTime());
                                //move photo to uploads directory
                                photo.mv("../public_html/uploads/" + fileName + ".jpg");

                                req.getConnection(function (err, conn) {
                                    if (err) return next("Cannot Connect");

                                    //get data
                                    var data = {
                                        fileName: fileName + ".jpg",
                                        vehicleId: results.insertId,
                                        type: "vehicle",
                                        checkpointId: null,
                                        sparePartId: null,
                                    };

                                    var query = conn.query("INSERT INTO images set ? ", data, function (err, results, fields) {
                                        if (err) {
                                            console.log(err);
                                            return next("Mysql error, check your query");
                                        }
                                    });
                                });

                                //push file details
                                data.push({
                                    name: fileName + ".jpg", mimetype: photo.mimetype, size: photo.size,
                                });
                            });

                            //return response
                            res.send({
                                status: true, message: "Files are uploaded", data: data,
                            });
                        } else {
                            let photo = req.files.file;
                            fileName = require("crypto").randomBytes(16).toString("hex");
                            fileName += String(new Date().getTime());
                            //Use the mv() method to place the file in upload directory (i.e. "uploads")
                            photo.mv("../uploads/" + fileName + ".jpg");

                            req.getConnection(function (err, conn) {
                                if (err) return next("Cannot Connect");

                                //get data
                                var data = {
                                    fileName: fileName + ".jpg",
                                    vehicleId: results.insertId,
                                    type: "vehicle",
                                    checkpointId: null,
                                    sparePartId: null,
                                };

                                var query = conn.query("INSERT INTO images set ? ", data, function (err, results, fields) {
                                    if (err) {
                                        console.log(err);
                                        return next("Mysql error, check your query");
                                    }
                                });
                            });
                        }
                    });
                }

                res.setHeader("Content-Type", "application/json");

                console.log(results);

                res.end(JSON.stringify({vehicleId: results.insertId}));

                console.log("successfully");
            });
        });
    });
});

var vehicleList = router.route("/api/vehicleList/:status?");

vehicleList.post(function (req, res, next) {
    console.log("vehicle :" + req.query.id);

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        var query1 = conn.query(`select * from users where token = '${req.body.token}'`, function (err, results) {
            let queryText = 'Select vehicle.*,vehicle.id as vId, (SELECT count(*) from spareparts where spareparts.vehicleid = vid and spareparts.status="INSTALLED" ) as InstalledCount, (SELECT count(*) from spareparts where spareparts.vehicleid = vid and spareparts.status="OPEN" ) as OpenCount,(SELECT count(*) from spareparts where spareparts.vehicleid = vid and spareparts.status="ORDERED" ) as OrderCount,(SELECT count(*) from spareparts where spareparts.vehicleid = vid and spareparts.status="ARRIVED" ) as ArriveCount,  \n' + "brands.title as brand,categories.title as category,models.title as model,conditions.title as conditionTitle,conditions.color as conditionColor , \n" + '(SELECT JSON_ARRAY(JSON_OBJECT("id", id, "fileName", fileName)) from images where images.vehicleId = vId and images.type = \'vehicle\' ORDER BY id desc LIMIT 1) as jsn from vehicle \n' + "JOIN brands ON vehicle.brandId=brands.id \n" + "JOIN models ON vehicle.modelId=models.id \n" + "JOIN categories ON vehicle.categoryId=categories.id \n" + "LEFT JOIN conditions ON conditions.id=vehicle.conditionId WHERE vehicle.status != 'DELIVERED' ORDER BY vehicle.id DESC";

            console.log(queryText);
            console.log(results[0]);

            if (results[0] && results[0].role === "sale") {
                queryText = queryText + " where STATUS in('sole','sale')";
            }

            if (req.query.id != null) queryText = "Select vehicle.*,vehicle.id as vId,brands.title as brand,categories.title as category,models.title as model,conditions.title as conditionTitle,conditions.color as conditionColor , \n" + '(SELECT JSON_ARRAY(JSON_OBJECT("id", id, "fileName", fileName)) from images where images.vehicleId = vId and images.type = \'vehicle\' ORDER BY id desc LIMIT 1) as jsn from vehicle \n' + "JOIN brands ON vehicle.brandId=brands.id \n" + "JOIN models ON vehicle.modelId=models.id \n" + "JOIN categories ON vehicle.categoryId=categories.id \n" + "LEFT JOIN conditions ON conditions.id=vehicle.conditionId" + " where vehicle.id = " + req.query.id;

            if (req.params.status == "workShopArchive" && req.query.id == null) {
                queryText = "Select vehicle.id as vehicleId,vehicle.*,brands.title as brand,categories.title as category,models.title as model,conditions.title as conditionTitle,conditions.color as conditionColor, (Select count(*) as total from areas join zones\n" + " on areas.id=zones.areaId join checkpoints on checkpoints.zoneId=zones.id join checkstate on checkstate.checkpointId=checkpoints.id) as total , (Select count(*) as totaldone from areas join zones on areas.id=zones.areaId join checkpoints on checkpoints.zoneId=zones.id join checkstate on checkstate.checkpointId=checkpoints.id where checkstate.vehicleId = vehicle.id and (checkstate.status = 'done' OR checkstate.status = 'ok')) as done,\n" + "(SELECT count(*) from spareparts where spareparts.vehicleid = vehicleId and spareparts.status=\"INSTALLED\" ) as InstalledCount,\n" + "(select count(*) as ordered from spareparts where spareparts.status = 'ORDERED' AND spareparts.vehicleId = vehicle.id ) as 'OrderCount',\n" + "(select count(*) as arrived from spareparts where spareparts.status = 'ARRIVED' AND spareparts.vehicleId = vehicle.id ) as 'ArriveCount' \n" + " from vehicle JOIN brands ON\n" + " vehicle.brandId=brands.id JOIN models ON vehicle.modelId=models.id JOIN categories ON vehicle.categoryId=categories.id LEFT JOIN conditions ON conditions.id=vehicle.conditionId WHERE vehicle.status IN ( 'FINALPREPARATIONS', 'WORKSHOP') ORDER BY vehicle.id desc";
            }

            if (req.params.status == "delivered" && req.query.id == null) {
                queryText = 'Select vehicle.*,vehicle.id as vId, (SELECT count(*) from spareparts where spareparts.vehicleid = vid and spareparts.status="INSTALLED" ) as InstalledCount, (SELECT count(*) from spareparts where spareparts.vehicleid = vid and spareparts.status="OPEN" ) as OpenCount,(SELECT count(*) from spareparts where spareparts.vehicleid = vid and spareparts.status="ORDERED" ) as OrderCount,(SELECT count(*) from spareparts where spareparts.vehicleid = vid and spareparts.status="ARRIVED" ) as ArriveCount,  \n' + "brands.title as brand,categories.title as category,models.title as model,conditions.title as conditionTitle,conditions.color as conditionColor , \n" + '(SELECT JSON_ARRAY(JSON_OBJECT("id", id, "fileName", fileName)) from images where images.vehicleId = vId and images.type = \'vehicle\' ORDER BY id desc LIMIT 1) as jsn from vehicle \n' + "JOIN brands ON vehicle.brandId=brands.id \n" + "JOIN models ON vehicle.modelId=models.id \n" + "JOIN categories ON vehicle.categoryId=categories.id \n" + "LEFT JOIN conditions ON conditions.id=vehicle.conditionId WHERE vehicle.status = 'DELIVERED' ORDER BY vehicle.id DESC";
            }


            var query2 = conn.query(queryText, function (err, results) {
                if (err) {
                    console.log(err);
                    return next(err);
                }

                results = results.map((item) => {
                    item.purchasePrice = parseFloat(item.purchasePrice.replace(",", ""));
                    return item;
                });

                res.setHeader("Content-Type", "application/json");

                res.end(JSON.stringify({data: results}));

                //  console.log(results);

                console.log("successfully");
            });
        });
    });
});

var physicalRecording = router.route("/api/physicalRecording");
physicalRecording.put(function (req, res, next) {
    let tokenCode = req.body.token;
    submitTracking(tokenCode, "Vehicle status updated to ARRIVED", req, req.body.vehicleId).then((data) => {
        console.log("physicalRecording init");
        req.getConnection(function (err, conn) {
            if (err) return next("Cannot Connect");
            let sdate = req.body.startDate ? req.body.startDate : null;
            let data = [req.body.vehicleNumber, req.body.conditionId, sdate, req.body.vehicleId,];
            var query = conn.query("UPDATE vehicle SET vehicleNumber = ? , conditionId = ? , startDate = ?, status = 'ARRIVED' WHERE id = ?", [...data], function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({state: true}));

                console.log("updated");
            });
        });
    });
});

var SparePart = router.route("/api/spareparts/:vehicleId?");

SparePart.get(function (req, res, next) {
    let queryTxt = "select vehicle.id as vehicleId,spareparts.checkpointId as chk,spareparts.id as spid,vehicle.*,spareparts.*,brands.title as brandTitle, models.title as modelTitle, categories.title as categoryTitle,\n" + "(SELECT JSON_ARRAY(JSON_OBJECT('id', id, 'fileName', fileName)) from images where images.sparePartId = spid limit 1) as jsn, price from spareparts\n" + "join vehicle on spareparts.vehicleId = vehicle.id \n" + "JOIN brands ON vehicle.brandId=brands.id\n" + "JOIN models ON vehicle.modelId=models.id\n" + "JOIN categories ON vehicle.categoryId=categories.id \n";
    if (req.params.vehicleId) queryTxt += " where vehicle.id = " + req.params.vehicleId;
    queryTxt = queryTxt + " ORDER BY vehicle.id DESC";
    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        var query = conn.query(queryTxt, function (err, results) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }
            console.log(queryTxt)
            let stats = [];
            if (results.length > 0) {
                results.map((i) => {
                    stats.push(i.status);
                });
                console.log(stats);
                if (!stats.includes("OPEN") && !stats.includes("ORDERED")) {
                    console.log("HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHhhhhhhhhhh");
                    //sendSparePartsEmail();
                }
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(results));

            console.log("get reqspareparts");
        });
    });
});

SparePart.post(function (req, res, next) {
    let vehicleId = req.body.vehicleId;
    let checkpointId = req.body.checkpointId;
    console.log("physicalRecording init");

    let userId = 0;
    submitTracking(req.body.token, "A spare part was submitted", req, req.body.vehicleId).then((data) => {
        userId = data.data.id;
        req.getConnection(function (err, conn) {
            if (err) return next("Cannot Connect");

            let data = {
                vehicleId: req.body.vehicleId,
                checkpointId: req.body.checkpointId,
                title: req.body.title,
                description: req.body.description,
                suppliers: req.body.suppliers,
                status: "OPEN",
                creatorId: userId,
            };

            var query = conn.query("insert into spareparts set ?", data, function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                debugger;

                if (req.files != null) {
                    req.getConnection(function (err, conn) {
                        if (err) return next("Cannot Connect");

                        debugger;

                        if (Array.isArray(req.files["photos[]"])) {
                            let data = [];

                            //loop all files
                            req.files["photos[]"].map((photo) => {
                                //let photo = req.files.photos[key];

                                let fileName = require("crypto")
                                    .randomBytes(16)
                                    .toString("hex");
                                fileName += String(new Date().getTime());
                                //move photo to uploads directory
                                photo.mv("../public_html/uploads/" + fileName + ".jpg");

                                req.getConnection(function (err, conn) {
                                    if (err) return next("Cannot Connect");

                                    //get data
                                    var data = {
                                        fileName: fileName + ".jpg",
                                        vehicleId: vehicleId,
                                        type: "sparepart",
                                        checkpointId: checkpointId,
                                        sparePartId: results.insertId,
                                    };

                                    var query = conn.query("INSERT INTO images set ? ", data, function (err, results, fields) {
                                        if (err) {
                                            console.log(err);
                                            return next("Mysql error, check your query");
                                        }
                                    });
                                });

                                //push file details
                                data.push({
                                    name: fileName + ".jpg", mimetype: photo.mimetype, size: photo.size,
                                });
                            });

                            //return response
                            res.send({
                                status: true, message: "Files are uploaded", data: data,
                            });
                        } else {
                            let photo = req.files.file;

                            fileName = require("crypto").randomBytes(16).toString("hex");
                            fileName += String(new Date().getTime());
                            //Use the mv() method to place the file in upload directory (i.e. "uploads")
                            photo.mv("../uploads/" + fileName + ".jpg");

                            req.getConnection(function (err, conn) {
                                if (err) return next("Cannot Connect");

                                //get data
                                var data = {
                                    fileName: fileName + ".jpg",
                                    vehicleId: vehicleId,
                                    type: "sparepart",
                                    checkpointId: checkpointId,
                                    sparePartId: results.insertId,
                                };

                                var query = conn.query("INSERT INTO images set ? ", data, function (err, results, fields) {
                                    if (err) {
                                        console.log(err);
                                        return next("Mysql error, check your query");
                                    }
                                });
                            });
                        }
                    });
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({state: true}));

                console.log("insert spareparts");
            });
        });
    });
});
router.delete("/api/deleteSparePart", function (req, res, next) {
    //submitTracking(req.body.token,"A spare part was deleted",req).then( data => {
    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");
        conn.query("DELETE FROM `spareparts` WHERE id = ?", [req.query.id], (e, r) => {
            res.status(200).send({backStatus: "1"});
        });
    });
    //})
});
SparePart.put(function (req, res, next) {
    console.log("physicalRecording init");

    submitTracking(req.body.token, "A spare part status was updated", req).then((data) => {
        req.getConnection(function (err, conn) {
            if (err) return next("Cannot Connect");
            var timer = "";
            console.log(req.body.status);
            if (req.body.status == "OPEN") {
                timer = "RequestDate";
            } else if (req.body.status == "ARRIVED") {
                timer = "ArriveDate";
            } else if (req.body.status == "INSTALLED") {
                timer = "InstalledDate";
            } else {
                timer = "OrderDate";
            }
            let data = [req.body.status, req.body.price, new Date(), req.body.id];

            var query = conn.query(`update spareparts set status = ?, price = ?, ${timer} = ? where id = ?`, [...data], function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                var query1 = conn.query(`select * from spareparts where vehicleId = ${req.body.vehicleId} AND (status = 'OPEN' OR status = 'ORDERED')`, function (err, parts) {
                    if (err) {
                        console.log(err);
                        return next("Mysql error, check your query");
                    }
                    var query3 = conn.query("SELECT * from setting", (e, emai) => {
                        if (e) {
                            console.log(e);
                            return next("Mysql error, check your query");
                        }
                        console.log("XXXXXXXXXXXXXXXX", parts);
                        if (parts.length === 0) {
                            sendSparePartsEmail(emai[0].adminEmail);
                        }

                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify({result: true}));
                    });
                });
            });
        });
    });
});

var SparePartEdit = router.route("/api/sparepartsedit/");
SparePartEdit.put(function (req, res, next) {
    let queryTxt = "";
    let vehicleId = req.body.vehicleId;
    let checkpointId = req.body.checkpointId;

    submitTracking(req.body.token, "A spare part information was editted", req, vehicleId).then((data) => {
        req.getConnection(function (err, conn) {
            if (err) return next("Cannot Connect");

            //let data = [req.body.sparePartId,req.body.title,req.body.description];

            queryTxt = `UPDATE spareparts SET title = '${req.body.title}',description = '${req.body.description}' WHERE id = ${req.body.sparePartId}`;

            var query = conn.query(queryTxt, function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                debugger;

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({state: true}));

                console.log("update spareparts");
            });
        });
    });
});

var SparePartImages = router.route("/api/sparepartimage/");

SparePartImages.post(function (req, res, next) {
    let queryTxt = `select * from images where checkpointId = ${req.body.checkpointId} and vehicleId = ${req.body.vehicleId}`;

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        var query = conn.query(queryTxt, function (err, results) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(results));

            console.log("get reqspareparts");
        });
    });
});

var SparePartOfCheck = router.route("/api/SparePartOfCheck/:vehicleId?/:checkPointId?");
SparePartOfCheck.get(function (req, res, next) {
    let queryTxt = "";
    let ext = "";

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        queryTxt = `SELECT * FROM checkstate join spareparts on checkstate.checkpointId = spareparts.checkpointId AND checkstate.vehicleId = spareparts.vehicleId where spareparts.vehicleId = ${req.params.vehicleId} AND spareparts.checkpointId = ${req.params.checkPointId}`;

        var query = conn.query(queryTxt, function (err, results) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({data: results}));

            console.log("updated");
        });
    });
});

var checkState = router.route("/api/checkState/:vehicleId?/:checkPointId?");
router.get("/api/getRepairImage", (req, res, next) => {
    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");
        var q = conn.query(`SELECT * from images where vehicleid = ? and type = "repair" ORDER BY id desc`, [req.query.vehicleId], (er, re) => {
            if (er) {
                console.log(er);
                return next("Mysql error, check your query");
            }
            console.log(re);
            res.status(200).send(re);
        });
    });
});
checkState.get(function (req, res, next) {
    console.log("physicalRecording init");
    let queryTxt = "";
    let ext = "";

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        ext = "where vehicleId = " + req.params.vehicleId;

        queryTxt = `select * from checkstate ${ext}`;

        var query = conn.query(queryTxt, function (err, results) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({data: results}));

            console.log("updated");
        });
    });
});

checkState.post(function (req, res, next) {
    let vehicleId = req.body.vehicleId;
    let checkpointId = req.body.checkpointId;
    let status = req.body.status;
    let description = req.body.description ? req.body.description : "";
    let hour = req.body.hour ? req.body.hour : "0";
    let min = req.body.min ? req.body.min : "0";
    let tiresSize = req.body.tiresSize ? req.body.tiresSize : "0";
    let tiresAge = req.body.tiresAge ? req.body.tiresAge : "0";

    console.log("physicalRecording init");

    console.log(req.body.token);

    debugger;

    let token = req.body.token;
    let userId = 0;
    submitTracking(token, "checkState submited", req, req.body.vehicleId).then((data) => {
        userId = data.data.id;

        req.getConnection(function (err, conn) {
            if (err) return next("Cannot Connect");

            let fileNAME = require("crypto").randomBytes(16).toString("hex");
            fileNAME += String(new Date().getTime());
            if (req.files) {
                let photo = req.files.file;
                photo.mv("../uploads/" + fileNAME + ".jpg");
                let imageData = {
                    fileName: fileNAME + ".jpg",
                    vehicleId: vehicleId,
                    type: "repair",
                    checkpointId: checkpointId,
                    sparePartId: null,
                };
                var imgQuery = conn.query("INSERT INTO images SET ?", [imageData], (e, r) => {
                    if (e) return next("Cannot Connect");
                    console.log("FILE UPLOADED SUCCESSFULLY", r);
                });
            }

            var query = conn.query(`SELECT count(*) as count FROM checkstate WHERE vehicleId = ${vehicleId} AND checkpointId = ${checkpointId}`, function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                let data = {
                    vehicleId: vehicleId,
                    checkpointId: checkpointId,
                    status: status,
                    description: description,
                    hour: hour,
                    min: min,
                    modifireId: userId,
                    tiresSize: tiresSize,
                    tiresAge: tiresAge,
                };

                console.log(results[0].count);

                if (results[0].count == 0) {
                    var query2 = conn.query("INSERT INTO checkstate set ?", data, function (err, results) {
                        if (err) {
                            console.log(err);
                            return next("Mysql error, check your query");
                        }

                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify({state: true}));

                        console.log("updated");
                    });
                }
            });
        });
    });
});

checkState.put(function (req, res, next) {
    let queryTxt = "";
    let userId = 0;

    submitTracking(req.body.token, "update checkstate", req, req.body.vehicleId)
        .then((data) => {
            userId = data.data.id;

            req.getConnection(function (err, conn) {
                if (err) return next("Cannot Connect");

                let status = req.body.status;
                let description = req.body.description != "" && req.body.description ? req.body.description : "";
                let hour = req.body.hour != "" && req.body.hour ? req.body.hour : "";
                let min = req.body.min != "" && req.body.min != null ? req.body.min : "";
                let tiresSize = req.body.tiresSize != "" && req.body.tiresSize != null ? req.body.tiresSize : "";
                let tiresAge = req.body.tiresAge != "" && req.body.tiresAge != null ? req.body.tiresAge : "";

                let fileNAME = require("crypto").randomBytes(16).toString("hex");
                fileNAME += String(new Date().getTime());
                if (req.files) {
                    let photo = req.files.file;
                    photo.mv("../uploads/" + fileNAME + ".jpg");
                    let imageData = {
                        fileName: fileNAME + ".jpg",
                        vehicleId: req.body.vehicleId,
                        type: "repair",
                        checkpointId: req.body.checkpointId,
                        sparePartId: null,
                    };
                    var imgQuery = conn.query("INSERT INTO images SET ?", [imageData], (e, r) => {
                        if (e) return next("Cannot Connect");
                        console.log("FILE UPLOADED SUCCESSFULLY", r);
                    });
                }

                queryTxt = `SELECT * FROM spareparts WHERE checkpointId = ${req.body.checkpointId} and status = 'OPEN'`;
                var query = conn.query(queryTxt, function (err, results) {
                    if (true || results.length === 0 || req.body.status === "partOk") {
                        queryTxt = `UPDATE checkstate SET status = '${status}' , description =  '${description}',`;
                        if (hour !== "" || min !== "") queryTxt = queryTxt + `hour = '${hour}' , min = '${min}',`;
                        queryTxt = queryTxt + `modifireId = '${userId}', tiresSize = '${tiresSize}', tiresAge = '${tiresAge}'  WHERE checkpointId = ${req.body.checkpointId}`;

                        var query = conn.query(queryTxt, function (err, results) {
                            if (err) {
                                console.log(err);
                                return next("Mysql error, check your query");
                            }

                            conn.query(`SELECT COUNT(*) AS count FROM checkstate WHERE vehicleId = ${req.body.vehicleId} AND status = 'no'`, (err, results) => {
                                if (results[0].count > 0) {
                                    conn.query(`UPDATE vehicle SET status = 'WORKSHOP' WHERE id = ${req.body.vehicleId}`, (err, results) => {
                                        res.setHeader("Content-Type", "application/json");
                                        res.end(JSON.stringify({state: true, status: "workshop"}));
                                    });
                                } else {
                                    conn.query(`UPDATE vehicle SET status = 'CHECKED' WHERE id = ${req.body.vehicleId}`, (err, results) => {
                                        res.setHeader("Content-Type", "application/json");
                                        res.end(JSON.stringify({state: true, status: "sale"}));
                                    });
                                }
                                console.log("updated");
                            });
                        });
                    } else {
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify({state: false, message: "not"}));
                    }
                });
            });
        })
        .catch((error) => res.json({error}));
});

var checkStateDetect = router.route("/api/checkStatedetect/:vehicleId?/:checkPointId?");

var checkBrand = router.route("/api/checkbrand/:title?");
checkBrand.get(function (req, res, next) {
    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        var query = conn.query("Select count(*) as countRow from brands where title = ? ", req.params.title, function (err, results) {
            if (err) {
                return next("Mysql error, check your query");
            }
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({hasTitle: results[0].countRow}));
        });
    });
});

router.post("/api/vehicle_update_status", function (req, res, next) {
    req.getConnection(function (error, connection) {
        if (error) {
            return next(error);
        } else {
            connection.query("UPDATE vehicle SET status = ? WHERE id = ?", [req.body.new_status, req.body.vehicle_id], (error, results) => {
                if (req.body.new_status == "DELIVERED") {
                    connection.query("UPDATE vehicle set vehicleNumber = '' WHERE id = ?", [req.body.vehicle_id]);
                }

                if (error) {
                    res.send({
                        status: false, vehicle_id: 0, newStatus: null, error,
                    });
                } else {
                    res.send({
                        status: true, vehicle_id: req.body.vehicle_id, new_status: req.body.new_status,
                    });
                }
            });
        }
    });
});


router.post("/api/delete_vehicle", function (req, res, next) {
    req.getConnection(function (error, connection) {
        if (error) {
            return next(error);
        } else {
            connection.query("DELETE FROM vehicle WHERE id = ?", [req.body.vehicle_id], (error, results) => {

                res.json({
                    status: true, message: 'Vehicle deleted.'
                })
            });
        }
    });
});


router.post("/api/update_vehicle_image/:vehicle_id", function (req, res, next) {
    req.getConnection(function (error, connection) {
        if (error) {
            return next(error);
        } else {
            let photo = req.files.image;
            fileName = require("crypto").randomBytes(16).toString("hex");
            fileName += String(new Date().getTime());
            //Use the mv() method to place the file in upload directory (i.e. "uploads")
            photo.mv("../uploads/" + fileName + ".jpg");

            req.getConnection(function (err, conn) {
                if (err) return next("Cannot Connect");

                //get data
                var data = {
                    fileName: fileName + ".jpg",
                    vehicleId: req.params.vehicle_id,
                    type: "vehicle",
                    checkpointId: null,
                    sparePartId: null,
                };

                var query = conn.query("INSERT INTO images set ? ", data, function (err, results, fields) {
                    if (err) {
                        console.log(err);
                        return next("Mysql error, check your query");
                    }
                });

                res.json({
                    status: true, fileName,
                });
            });
        }
    });
});

router.get("/api/calculate_internal_workshop_cost/:vehicle_id", function (req, res, next) {
    req.getConnection(function (error, connection) {
        if (error) {
            return next(error);
        } else {
            connection.query("SELECT * FROM setting", function (error, results) {
                if (error) {
                    return next(error);
                } else {
                    const workshop_cost = results[0].WorkShopCost;
                    connection.query("SELECT * FROM checkstate WHERE vehicleId = ? AND status = 'internal_ok'", req.params.vehicle_id, function (error, results) {
                        if (error) {
                            return next(error);
                        } else {
                            const total = results.reduce((p, c) => {
                                return (p + parseFloat(workshop_cost) * (parseFloat(c.hour || 0) + parseFloat(c.min || 0) / 60));
                            }, 0);

                            connection.query("UPDATE vehicle SET workshop_i_cost = ? WHERE id = ?", [total, req.params.vehicle_id], function (error) {
                                if (error) {
                                    return next(error);
                                } else {
                                    res.json({
                                        status: true,
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

var brands = router.route("/api/brands/:brandId?");
brands.post(function (req, res, next) {
    console.log("init");

    debugger;

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        //get data
        var data = {
            createDate: new Date(), title: req.body.title,
        };

        var query = conn.query("INSERT INTO brands set ? ", data, function (err, results, fields) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({state: true, id: results.insertId}));

            console.log("successfully");
        });
    });
});

brands.put(function (req, res, next) {
    console.log("init");

    debugger;

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        var query = conn.query("UPDATE brands SET title = ? WHERE id = ?", [req.body.title, req.body.id], function (err, results, fields) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({state: true, id: results.insertId}));

            console.log("successfully");
        });
    });
});

brands.get(function (req, res, next) {
    console.log("init");

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        var query = conn.query("Select * from brands ORDER BY title", function (err, results) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(results));

            console.log("successfully");
        });
    });
});

brands.delete(function (req, res, next) {
    debugger;

    console.log("init");

    console.log(req.body.brandId);

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        if (req.body.brandId.toString().includes(",")) {
            console.log("multi");
            var query = conn.query("Delete from brands Where id IN (?)", [req.body.brandId], function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("successfully");
            });
        } else {
            console.log("single");
            var query = conn.query("Delete from brands Where id = ?", parseInt(req.body.brandId), function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("successfully");
            });
        }
    });
});

var models = router.route("/api/models");
models.post(function (req, res, next) {
    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        //get data
        var data = {
            brandId: parseInt(req.body.brandId), title: req.body.title, createDate: new Date(),
        };

        var query = conn.query("INSERT INTO models set ? ", data, function (err, results, fields) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({state: true, id: results.insertId}));

            console.log("successfully");
        });
    });
});

models.delete(function (req, res, next) {
    debugger;

    console.log("init");

    console.log(req.body.modelId);

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        if (req.body.modelId.toString().includes(",")) {
            console.log("multi");
            var query = conn.query("Delete from models Where id IN (?)", [req.body.modelId], function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("delete model successfully");
            });
        } else {
            console.log("single");
            var query = conn.query("Delete from models Where id = ?", parseInt(req.body.modelId), function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("delete model successfully");
            });
        }
    });
});

models.put(function (req, res, next) {
    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        var query = conn.query("UPDATE models SET title = ?,brandId = ? WHERE id = ? ", [req.body.title, parseInt(req.body.brandId), req.body.id], function (err, results, fields) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({state: true, id: results.insertId}));

            console.log("successfully");
        });
    });
});

var getModel = router.route("/api/getmodels");
getModel.post(function (req, res, next) {
    console.log(req.body.w);

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        if (req.body.w == "all") {
            var query = conn.query("Select models.*,brands.title as brandTitle from models join brands on models.brandId = brands.id ORDER BY models.title", function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("get successfully");
            });
        } else if (typeof parseInt(req.body.w) == "number") {
            var query = conn.query("Select * from models where brandId = ? ", req.body.w.toString(), function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log(results);
            });
        }
    });
});

var category = router.route("/api/categories/");
category.post(function (req, res, next) {
    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        //get data
        var data = {
            createDate: new Date(), title: req.body.title,
        };

        var query = conn.query("INSERT INTO categories set ? ", data, function (err, results, fields) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({state: true, id: results.insertId}));

            console.log("successfully");
        });
    });
});

category.delete(function (req, res, next) {
    debugger;

    console.log("init");

    console.log(req.body.id);

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        if (req.body.id.toString().includes(",")) {
            console.log("multi");
            console.log(req.body.id);
            var query = conn.query("Delete from categories Where id IN (?)", [req.body.id], function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("delete categories successfully");
            });
        } else {
            console.log("single");
            var query = conn.query("Delete from categories Where id = ?", parseInt(req.body.id), function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("delete category successfully");
            });
        }
    });
});

category.put(function (req, res, next) {
    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        var query = conn.query("UPDATE categories SET title = ?,modelId = ? WHERE id = ? ", [req.body.title, req.body.id], function (err, results, fields) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({state: true, id: results.insertId}));

            console.log("successfully");
        });
    });
});

var getCategories = router.route("/api/getcategories");
getCategories.post(function (req, res, next) {
    console.log(req.body.w);

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        if (req.body.w == "all") {
            var query = conn.query("Select * from categories ORDER BY title", function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("get successfully");
            });
        } else if (typeof parseInt(req.body.w) == "number") {
            var query = conn.query("Select * from categories", req.body.w.toString(), function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log(results);
            });
        }
    });
});

var areas = router.route("/api/areas/:AreaId?");
areas.post(function (req, res, next) {
    console.log("init");

    debugger;

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        //get data
        var data = {
            createDate: new Date(), title: req.body.title, type: req.body.type,
        };

        var query = conn.query("INSERT INTO areas set ? ", data, function (err, results, fields) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({state: true, id: results.insertId}));

            console.log("successfully");
        });
    });
});

areas.put(function (req, res, next) {
    console.log("init");

    debugger;

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        var query = conn.query("UPDATE areas SET title = ?, type = ?, position = ? WHERE id = ?", [req.body.title, req.body.type, req.body.position, req.body.id], function (err, results, fields) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({state: true, id: results.insertId}));

            console.log("successfully");
        });
    });
});

areas.get(function (req, res, next) {
    console.log("init");

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        var query = conn.query("Select * from areas order by position asc", function (err, results) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(results));

            console.log("successfully");
        });
    });
});

areas.delete(function (req, res, next) {
    debugger;

    console.log("init");

    console.log(req.body.areaId);

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        if (req.body.areaId.toString().includes(",")) {
            console.log("multi");
            var query = conn.query("Delete from areas Where id IN (?)", [req.body.areaId], function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("successfully");
            });
        } else {
            console.log("single");
            var query = conn.query("Delete from areas Where id = ?", parseInt(req.body.areaId), function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("successfully");
            });
        }
    });
});

var zones = router.route("/api/zones/:ZoneId?");
zones.post(function (req, res, next) {
    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        //get data
        var data = {
            areaId: parseInt(req.body.areaId), title: req.body.title, createDate: new Date(),
        };

        var query = conn.query("INSERT INTO zones set ? ", data, function (err, results, fields) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({state: true, id: results.insertId}));

            console.log("successfully");
        });
    });
});

zones.get(function (req, res, next) {
    console.log(req.params.ZoneId);

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        if (req.params.ZoneId == "" || req.params.ZoneId == undefined) {
            var query = conn.query("Select zones.*,areas.title as areaTitle from zones join areas on zones.areaId = areas.id order by zones.position asc", function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("get successfully");
            });
        } else if (typeof parseInt(req.body.w) == "number") {
            var query = conn.query("Select * from zones where zoneId = ? ", req.params.ZoneId, function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log(results);
            });
        }
    });
});

zones.delete(function (req, res, next) {
    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        if (Array.isArray(req.body.zoneId)) {
            console.log("multi");
            var query = conn.query("Delete from zones Where id IN (?)", [...req.body.zoneId], function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("delete model successfully");
            });
        } else {
            console.log("single");
            var query = conn.query("Delete from zones Where id = ?", parseInt(req.body.zoneId), function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("delete model successfully");
            });
        }
    });
});

zones.put(function (req, res, next) {
    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        var query = conn.query("UPDATE zones SET title = ?,areaId = ?, position = ? WHERE id = ? ", [req.body.title, parseInt(req.body.areaId), req.body.position, req.body.id,], function (err, results, fields) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({state: true, id: results.insertId}));

            console.log("successfully");
        });
    });
});

var checkpoints = router.route("/api/checkpoints/:checkPointsId?");
checkpoints.post(function (req, res, next) {
    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        //get data
        var data = {
            // areaId: parseInt(req.body.areaId),
            zoneId: parseInt(req.body.zoneId), title: req.body.title, type: req.body.type, createDate: new Date(),
        };

        var query = conn.query("INSERT INTO checkpoints set ? ", data, function (err, results, fields) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({state: true, id: results.insertId}));

            console.log("successfully");
        });
    });
});

checkpoints.get(function (req, res, next) {
    console.log("init");

    console.log(req.params.CheckPointId);

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        if (req.params.CheckPointId == "" || req.params.CheckPointId == undefined) {
            var query = conn.query("Select checkpoints.*,zones.title as zoneTitle from checkpoints join zones on checkpoints.zoneId = zones.id order by checkpoints.position asc", function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("get successfully");
                console.log(results);
            });
        } else if (typeof parseInt(req.body.w) == "number") {
            var query = conn.query("Select * from checkpoints where checkpointId = ? ", req.params.CheckPointId, function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log(results);
            });
        }
    });
});

checkpoints.delete(function (req, res, next) {
    debugger;

    console.log("init");

    console.log(req.body.modelId);

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        if (req.body.modelId.toString().includes(",")) {
            console.log("multi");
            var query = conn.query("Delete from checkpoints Where id IN (?)", [req.body.modelId], function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("delete model successfully");
            });
        } else {
            console.log("single");
            var query = conn.query("Delete from checkpoints Where id = ?", parseInt(req.body.modelId), function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("delete model successfully");
            });
        }
    });
});

checkpoints.put(function (req, res, next) {
    let txtQuery = "";

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        if (req.body.zoneId != null) {
            txtQuery += `UPDATE checkpoints SET title = '${req.body.title}', checkpoints.type = '${req.body.type}', position = ${req.body.position}, zoneId = ${req.body.zoneId} WHERE id = ${req.body.id}`;
        } else {
            txtQuery += `UPDATE checkpoints SET title = '${req.body.title}', checkpoints.type = '${req.body.type}', position = ${req.body.position} WHERE id = ${req.body.id}`;
        }

        console.log(txtQuery);

        var query = conn.query(txtQuery, function (err, results, fields) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({state: true, id: results.insertId}));

            console.log("successfully");
        });
    });
});

var gettotalpoints = router.route("/api/gettotalpoints/:vehicleId?/:areaId?/");
gettotalpoints.get(function (req, res, next) {
    console.log("init");

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");
        let queryText = "";
        let ext = "";

        // if(req.params.vehicleId)
        //     ext = ' where checkstate.vehicleId = ' + req.params.vehicleId;

        if (req.params.areaId != "0") {
            ext = ext + " areas.id = " + req.params.areaId + " and ";
        }

        queryText = `Select count(*) as total from areas join zones on areas.id=zones.areaId join checkpoints on checkpoints.zoneId=zones.id where ${ext}  areas.type= ${req.query.atype}`;

        console.log(queryText);

        var query = conn.query(queryText, function (err, results) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(results[0].total));

            console.log(results[0].total);
        });
    });
});

var gettotaldonepoints = router.route("/api/gettotaldonepoints/:vehicleId?/:areaId?/");
gettotaldonepoints.get(function (req, res, next) {
    console.log("init");

    console.log(req.params.areaId);

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        let queryTxt = "";

        let ext = "";

        if (req.params.vehicleId) if (req.params.areaId != "0") {
            ext = ext + "areas.id = " + req.params.areaId + " and ";
        }

        queryTxt = `SELECT COUNT(*) as totaldone FROM checkstate INNER JOIN checkpoints ON checkpoints.id = checkstate.checkpointId INNER JOIN zones ON zones.id = checkpoints.zoneId WHERE zones.areaId = ${req.params.areaId} AND checkstate.vehicleId = ${req.params.vehicleId};`;

        console.log(queryTxt);

        var query = conn.query(queryTxt, function (err, results) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(results[0].totaldone));

            console.log(results[0].totaldone);
        });
    });
});

router.get("/api/setIsNew", (req, res, next) => {
    submitTracking(req.query.token, "Vehicle status set to New(Mega Button was pressed)", req, req.query.vehicleId).catch((e) => {
        console.log(e);
    });
    req.getConnection(function (err, conn) {
        conn.query(`UPDATE vehicle SET isNew = 1 WHERE id = ${req.query.vehicleId}`, (er, re) => {
            if (er) {
                console.log(er);
                return res.status(500).send(er);
            }
            res.status(200).send("updated");
        });
    });
});

router.get("/api/uncheckCasuals", (req, res, next) => {
    req.getConnection(function (err, conn) {
        conn.query(`DELETE checkstate from checkstate 
                    join checkpoints on checkpoints.id = checkstate.checkpointId
                    join zones on checkpoints.zoneId = zones.id
                    join areas on areas.id = zones.areaId
                    WHERE areas.type = 1`, (er, re) => {
            if (er) {
                console.log(er);
                return res.status(500).send(er);
            }
            res.status(200).send("deleted");
        });
    });
});

var megaActionCheckpoints = router.route("/api/megaActionCheckpoint");
megaActionCheckpoints.post((req, res) => {
    if (!req.body.vehicleId) {
        res.json({
            status: false, message: "Vehicle Id is required",
        });
    } else if (req.body.type === undefined) {
        res.json({
            status: false, message: "Checkpoint type is required",
        });
    } else {
        req.getConnection(function (err, conn) {
            conn.query(`SELECT zones.*, areas.type FROM zones INNER JOIN areas ON areas.id = zones.areaId AND areas.type = ${req.body.type}`, (error, results) => {
                if (!error) {
                    Promise.all(results.map((result) => {
                        return new Promise((resolve, reject) => {
                            conn.query(`SELECT * FROM checkpoints WHERE zoneId = ${result.id}`, (error, results2) => {
                                Promise.all(results2.map((result) => {
                                    return new Promise((resolve, reject) => {
                                        conn.query(`SELECT * FROM checkstate WHERE vehicleId = ${req.body.vehicleId} AND checkpointId = ${result.id}`, (error, _r) => {
                                            if (_r.length) {
                                                conn.query(`UPDATE checkstate SET status = 'ok' WHERE vehicleId = '${req.body.vehicleId}' AND status = '0'`, (e, r) => resolve());
                                            } else {
                                                conn.query(`INSERT INTO checkstate(vehicleId, checkpointId, status) VALUES ('${req.body.vehicleId}', '${result.id}', 'ok')`, (e, r) => resolve());
                                            }
                                        });
                                    });
                                })).then(() => resolve());
                            });
                        });
                    })).then(() => {
                        res.json({ok: true});
                    });

                    results.forEach((result) => {
                    });
                }
            });
        });
    }
});

var checkAllCheckooints = router.route("/api/checkAllCheckooints/");
checkAllCheckooints.post(function (req, res, next) {
    let queryTxt = "";

    const vehicleId = req.body.vehicleId;
    const zoneId = req.body.zoneId;

    returnRequest(req, vehicleId, zoneId).then((getResults) => {
        req.getConnection(function (err, conn) {
            queryTxt = `SELECT * FROM checkpoints where zoneId = ${zoneId}`;
            let query3 = conn.query(queryTxt, function (err, results) {
                let all = null;
                debugger;
                all = getResults.data;
                for (let item of results) {
                    let has = false;
                    if (all) {
                        for (let subItem of all) {
                            console.log(subItem.checkpointId, " == ", item.id);
                            if (subItem.checkpointId == item.id) has = true;
                        }
                    }
                    if (has === false) {
                        let data = {
                            vehicleId: vehicleId,
                            checkpointId: item.id,
                            status: "ok",
                            description: "",
                            hour: "",
                            min: "",
                            modifireId: 6,
                            tiresSize: "",
                            tiresAge: "",
                        };
                        var query2 = conn.query("INSERT INTO checkstate set ?", data, function (err, results) {
                        });
                    }
                }
            });
        });
    });

    returnRequest2(req, vehicleId, zoneId).then((getResults) => {
        req.getConnection(function (err, conn) {
            let all = getResults.data;
            for (let item of all) {
                queryTxt = `UPDATE checkstate SET status = "ok" WHERE id = ${item.id} AND status = '0'`;
                let query2 = conn.query(queryTxt, function (err, results) {
                });
                //  let query3 = conn.query(`DELETE checkstate FROM checkstate INNER JOIN checkpoints on checkstate.checkpointId = checkpoints.id where checkstate.vehicleId = ${vehicleId} and  checkpoints.zoneId = ${zoneId} AND (checkstate.status != "ok" and checkstate.status != "done")`, function (err, results) {
                //	})
            }
        });
    });

    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({changed: "yes"}));
});

let returnRequest = (req, vehicleId, zoneId) => new Promise((resolve, reject) => {
    req.getConnection(function (err, conn) {
        let query1 = conn.query(`select checkstate.checkpointId from checkstate INNER JOIN checkpoints on checkstate.checkpointId = checkpoints.id where vehicleId = ${vehicleId} and zoneId = ${zoneId}`, function (err, results) {
            debugger;
            resolve({data: results});
        });
    });
});

let returnRequest2 = (req, vehicleId, zoneId) => new Promise((resolve, reject) => {
    req.getConnection(function (err, conn) {
        let query1 = conn.query(`select checkstate.id from checkstate INNER JOIN checkpoints on checkstate.checkpointId = checkpoints.id where vehicleId = ${vehicleId} and zoneId = ${zoneId} and (status != "ok" and status != "done") `, function (err, results) {
            debugger;
            resolve({data: results});
        });
    });
});

/*var query1 = conn.query(queryTxt, function (err, results) {
    allCheckPoints = results[0];
    queryTxt = `select * from checkpoints where zoneId = ${zoneId}`;
    var query2 = conn.query(queryTxt, function (err, results) {
        for (let item of allCheckPoints) {
            for(let subItem of results[0]){
                if (item.id === subItem.checkpointId){
                    if(subItem.status !== "ok" && subItem.status !== "done"){

                        var query3 = conn.query(queryTxt, function (err, results) {
                            break;
                        });
                    }
                }
            }
        }
    });

});*/

var detectPoints = router.route("/api/detectPoints/:vehicleId?/");
detectPoints.post(function (req, res, next) {
    let queryTxt = "";
    let oldStatus = "";
    let totalDone = "";
    let totalProcessed = "";
    let total = "";
    let status = "";

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        let ext = "";

        if (req.params.vehicleId) ext = " checkstate.vehicleId = " + req.params.vehicleId + " and  areas.type =" + req.query.atype + " and ";

        let queryTxt_totalDone = "Select count(*) as totalDone from areas join zones on areas.id=zones.areaId join checkpoints on checkpoints.zoneId=zones.id join checkstate on checkstate.checkpointId=checkpoints.id where" + ext + "(checkstate.status = 'done' OR checkstate.status = 'ok' OR checkstate.status = 'partOk');";
        let queryTxt_totalProcessed = "Select count(*) as totalProcessed from areas join zones on zones.areaId = `areas`.`id` join checkpoints on `zones`.`id` = `checkpoints`.`zoneId` join `checkstate` on checkstate.checkpointId=checkpoints.id where" + ext + "(checkstate.status = 'done' OR checkstate.status = 'ok' OR checkstate.status = 'partOk' OR checkstate.status = 'no');";
        let queryTxt_total = `Select count(*) as total from checkpoints join zones on checkpoints.zoneid = zones.id join areas on zones.areaid = areas.id WHERE areas.type = ${req.query.atype}`;
        //let queryTxt_total = "Select count(*) as total from areas join zones on areas.id=zones.areaId join checkpoints on checkpoints.zoneId=zones.id join checkstate on checkstate.checkpointId=checkpoints.id;";
        let queryTxt_status = "SELECT `status` FROM `vehicle` WHERE id = " + req.params.vehicleId;

        var query1 = conn.query(queryTxt_totalDone, function (err, results) {
            if (err) {
                console.log(err);
                return next("1", err);
            }

            // res.setHeader('Content-Type', 'application/json');
            // res.end(JSON.stringify('ssdf'));

            totalDone = results[0].totalDone.toString();

            console.log(results[0].totalDone);

            var query2 = conn.query(queryTxt_totalProcessed, function (err, results) {
                if (err) {
                    console.log(err);
                    return next("2", err);
                }

                // res.setHeader('Content-Type', 'application/json');
                // res.end(JSON.stringify('ssdf'));

                totalProcessed = results[0].totalProcessed.toString();

                console.log(results[0].totalProcessed);

                var query3 = conn.query(queryTxt_total, function (err, results) {
                    if (err) {
                        console.log(err);
                        return next("3", err);
                    }

                    // res.setHeader('Content-Type', 'application/json');
                    // res.end(JSON.stringify('ssdf'));

                    total = results[0].total.toString();

                    console.log(results[0].total);

                    var query4 = conn.query(queryTxt_status, function (err, results) {
                        if (err) {
                            console.log(err);
                            return next("4", err);
                        }

                        // res.setHeader('Content-Type', 'application/json');
                        // res.end(JSON.stringify('ssdf'));

                        status = results[0].status.toString();

                        console.log(results[0].status);
                        res.json({ok: true});

                        let changed = false;

                        //  if(status == "ARRIVED") {
                        if (totalDone == total && results[0].status != "SOLD") {
                            submitTracking(req.body.token, "Vehicle status updated to SALE", req, req.params.vehicleId).then((data) => {
                                queryTxt = "UPDATE `vehicle` SET `status` = 'SALE' WHERE `vehicle`.`id` = " + req.params.vehicleId;
                                var query4 = conn.query(queryTxt, function (err, results) {
                                    if (err) {
                                        console.log(err);
                                        return next("Mysql error, check your query");
                                    }
                                    res.setHeader("Content-Type", "application/json");
                                    if (status != "SALE") {
                                        changed = true;
                                    }
                                    res.end(JSON.stringify({changed: changed, newStatus: "SALE"}));
                                });
                            });
                            //SALE
                        } else if (totalProcessed == total && results[0].status != "SOLD") {
                            queryTxt = "UPDATE `vehicle` SET `status` = 'WORKSHOP' WHERE `vehicle`.`id` = " + req.params.vehicleId;
                            var query4 = conn.query(queryTxt, function (err, results) {
                                if (err) {
                                    console.log(err);
                                    return next("Mysql error, check your query");
                                }
                                res.setHeader("Content-Type", "application/json");
                                if (status != "WORKSHOP") {
                                    changed = true;
                                }
                                res.end(JSON.stringify({changed: changed, newStatus: "WORKSHOP"}));
                            });
                            //WORKSHOP
                        } else {
                            res.setHeader("Content-Type", "application/json");
                            res.end(JSON.stringify({result: true}));
                        }
                        //  }
                    });
                });
            });
        });
    });
});

var detectPreparationCost = router.route("/api/detectPreparationCost/:vehicleId?/");

detectPreparationCost.get(function (req, res, next) {
    let queryTxt = "";

    let vehicleId = req.params.vehicleId;

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        queryTxt = `SELECT checkstate.*, vehicle.PreparationRate FROM checkstate join vehicle 
						on vehicle.id = checkstate.vehicleId where checkstate.status = "done" AND vehicleId = '${vehicleId}'`;

        var query1 = conn.query(queryTxt, function (err, results) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query1");
            }

            let cost = 0;

            results.map((item) => {
                cost += (parseFloat(item.hour || 0) + parseFloat(item.min || 0) / 60) * item.PreparationRate;
            });

            var query2 = conn.query(`UPDATE vehicle SET preparationCost = '${cost}' WHERE id = '${vehicleId}';`, function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query2");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({result: true}));

                console.log("successfully update preparationCost");
            });
        });
    });
});

var detectWorkshopCost = router.route("/api/detectWorkshopCost/:vehicleId?/");

detectWorkshopCost.get(function (req, res, next) {
    let queryTxt = "";

    let vehicleId = req.params.vehicleId;
    let checkStateId = req.query.id;

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        queryTxt = `SELECT checkstate.*, vehicle.WorkShopRate FROM checkstate join vehicle 
						on vehicle.id = checkstate.vehicleId where checkstate.status = "partOk" AND vehicleId = '${vehicleId}'`;

        var query1 = conn.query(queryTxt, function (err, results) {
            if (err) {
                console.log(err);
                console.log(queryTxt);
                return next("Mysql error, check your query");
            }

            let cost = 0;

            results.map((item) => {
                cost += item.WorkShopRate * (parseFloat(item.hour || 0) + parseFloat(item.min || 0) / 60);
            });

            var query2 = conn.query(`UPDATE vehicle SET workshopCost = '${cost}' WHERE id = ${vehicleId};`, function (err, results) {
                if (err) {
                    console.log(err);
                    return next(err);
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({result: true}));

                console.log("successfully update preparationCost");
            });
        });
    });
});

router.put("/api/updateVehiclePriceRates", (req, res, next) => {
    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");
        conn.query("UPDATE vehicle SET ? where id = ?", [{
            purchasePrice: req.body.purchasePrice,
            inevtoryCost: req.body.inevtoryCost,
            processingCost: req.body.processingCost,
            sparePartsTotalCost: req.body.sparePartsTotalCost,
            workshop_i_cost: req.body.workshop_i_cost,
            workshop_e_cost: req.body.workshop_e_cost,
            standCosts: req.body.standCosts,
            preparationCost: req.body.preparationCost,
            financed: req.body.financed,
            identificationNumber: req.body.identificationNumber,
            customerName: req.body.customerName,
        }, req.body.vehicleId,], (e, r) => {
            if (e) {
                console.log(e);
                return next("Mysql error, check your query");
            }
            res.status(200).send();
        });
    });
});
var detectSparePartsCost = router.route("/api/detectSparePartsCost/:vehicleId?/");
detectSparePartsCost.get(function (req, res, next) {
    let queryTxt = "";

    let vehicleId = req.params.vehicleId;

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        queryTxt = `SELECT * FROM spareparts WHERE spareparts.status in ('ORDERED','ARRIVED')  AND vehicleId = ${vehicleId}`;

        var query1 = conn.query(queryTxt, function (err, results) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            let cost = 0;

            results.map((item) => {
                if (item.price != null && item.price != "") console.log("ITEM>>>>>>>", item);
                console.log("ITEM.price>>>>>>>", item.price);
                console.log("INITIAL COST", cost);
                cost += Number(item.price);
                console.log("INCREASED COST", cost);
            });

            var query2 = conn.query(`UPDATE vehicle SET sparePartsTotalCost =${cost} WHERE id = ${vehicleId};`, function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({result: true}));

                console.log("successfully update preparationCost");
            });
        });
    });
});

var fileCheckPoint = router.route("/api/fileCheckPoint/:vehicleId?/:type?/:checkpoint?");
fileCheckPoint.get(function (req, res, next) {
});

fileCheckPoint.post(async (req, res, next) => {
    let fileName = "";
    try {
        if (!req.files) {
            res.send({
                status: false, message: "No file uploaded",
            });
        } else {
            if (Array.isArray(req.files["photos[]"])) {
                let data = [];

                //loop all files
                req.files["photos[]"].map((photo) => {
                    //let photo = req.files.photos[key];

                    fileName = require("crypto").randomBytes(16).toString("hex");
                    fileName += String(new Date().getTime());
                    //move photo to uploads directory
                    photo.mv("../uploads/" + fileName + ".jpg");

                    req.getConnection(function (err, conn) {
                        if (err) return next("Cannot Connect");

                        //get data
                        var data = {
                            fileName: fileName + ".jpg",
                            vehicleId: req.params.vehicleId,
                            type: req.params.type,
                            checkpoint: req.params.checkpoint,
                        };

                        var query = conn.query("INSERT INTO images set ? ", data, function (err, results, fields) {
                            if (err) {
                                console.log(err);
                                return next("Mysql error, check your query");
                            }
                        });
                    });

                    //push file details
                    data.push({
                        name: fileName + ".jpg", mimetype: photo.mimetype, size: photo.size,
                    });
                });

                //return response
                res.send({
                    status: true, message: "Files are uploaded", data: data,
                });
            } else {
                let photo = req.files["photos[]"];

                fileName = require("crypto").randomBytes(16).toString("hex");
                fileName += String(new Date().getTime());
                //Use the mv() method to place the file in upload directory (i.e. "uploads")
                photo.mv("../uploads/" + fileName + ".jpg");

                req.getConnection(function (err, conn) {
                    if (err) return next("Cannot Connect");

                    //get data
                    var data = {
                        fileName: fileName + ".jpg",
                        vehicleId: req.params.vehicleId,
                        type: req.params.type,
                        checkpoint: req.params.checkpoint,
                    };

                    var query = conn.query("INSERT INTO images set ? ", data, function (err, results, fields) {
                        if (err) {
                            console.log(err);
                            return next("Mysql error, check your query");
                        }
                    });
                });

                //send response
                res.send({
                    status: true, message: "File is uploaded", data: {
                        name: fileName + ".jpg", mimetype: photo.mimetype, size: photo.size,
                    },
                });
            }
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

var submitSold = router.route("/api/submitSold/");
submitSold.post(function (req, res, next) {
    let vehicleId = req.body.vehicleId;
    let queryTxt = "";
    let standCosts;

    submitTracking(req.body.token, "Vehicle status updated to SOLD", req, req.body.vehicleId).then((data) => {
        req.getConnection(function (err, conn) {
            if (err) {
                return next(err);
            } else {
                conn.query("SELECT * FROM vehicle WHERE id = ?", vehicleId, function (errror, results) {
                    if (err) {
                        return next(error);
                    } else {
                        let purchaseDate = results[0].purchaseDate.split("/");
                        purchaseDate = new Date(purchaseDate[2], purchaseDate[1], purchaseDate[0]);

                        let saleDate = req.body.saleDate.split("/");
                        saleDate = new Date(saleDate[2], saleDate[1], saleDate[0]);

                        let diff = Math.abs(saleDate - purchaseDate) / (1000 * 60 * 60 * 24);

                        let query = conn.query(`UPDATE vehicle SET standCosts = '${
                  parseFloat(results[0].StandRate) * parseInt(diff)
                }', salePrice = '${req.body.salePrice}', saleDate = '${
                  req.body.saleDate
                }', status = 'SOLD' WHERE id = ${vehicleId}`, function (err, results1, fields) {
                            if (err) {
                                return next(err);
                            } else {
                                res.json({
                                    purchaseDate: purchaseDate, saleDate: saleDate,
                                });
                            }
                        });
                    }
                });
            }
        });
    });
});

var updateStandCosts = router.route("/api/updateStandCosts/:vehicleId?/");
updateStandCosts.get(function (req, res, next) {
    let vehicleId = req.params.vehicleId;
    let queryTxt = "";
    let standCosts;

    req.getConnection(function (err, conn) {
        queryTxt = `select id,firstRegisteration,saleDate,standCosts,StandRate as standCostsSetting from vehicle where vehicle.id = ${vehicleId}`;
        let query1 = conn.query(queryTxt, function (err, results, fields) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            let Difference_In_Time = new Date(results[0].saleDate).getTime() - new Date(results[0].firstRegisteration).getTime();
            let Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);

            standCosts = Difference_In_Days * Number(results[0].standCostsSetting);

            let query2 = conn.query(`UPDATE vehicle SET standCosts = '${standCosts}' WHERE vehicle.id = ${vehicleId} `, function (err, results, fields) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }
            });
        });
    });

    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({result: true}));

    console.log("successfully update StandCosts");
});

var conditions = router.route("/api/conditions/:conditionId?");
conditions.post(function (req, res, next) {
    console.log("init");

    debugger;

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        //get data
        var data = {
            createDate: new Date(), title: req.body.title, color: req.body.color, description: req.body.description,
        };

        var query = conn.query("INSERT INTO conditions set ? ", data, function (err, results, fields) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({state: true, id: results.insertId}));

            console.log("successfully");
        });
    });
});

conditions.put(function (req, res, next) {
    console.log("init");

    debugger;

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        const data = [req.body.title, req.body.color, req.body.description];

        var query = conn.query("UPDATE conditions SET title = ?,color = ?,description = ? WHERE id = ?", [...data, req.body.id], function (err, results, fields) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({state: true, id: results.insertId}));

            console.log("successfully");
        });
    });
});

conditions.get(function (req, res, next) {
    console.log("init");

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        var query = conn.query("Select * from conditions ", function (err, results) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(results));

            console.log("successfully");
        });
    });
});

conditions.delete(function (req, res, next) {
    debugger;

    console.log("init");

    console.log(req.body.conditionId);

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        if (req.body.conditionId.toString().includes(",")) {
            console.log("multi");
            var query = conn.query("Delete from conditions Where id IN (?)", [req.body.conditionId], function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("successfully");
            });
        } else {
            console.log("single");
            var query = conn.query("Delete from conditions Where id = ?", parseInt(req.body.conditionId), function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("successfully");
            });
        }
    });
});

var setting = router.route("/api/setting");
setting.get(function (req, res, next) {
    console.log("init");

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        var query = conn.query("Select * from setting ", function (err, results) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(results));

            console.log("successfully");
        });
    });
});

setting.put(function (req, res, next) {
    let queryTxt = "";

    console.log("init");

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        queryTxt = `update setting set inevtoryCost = '${req.body.inevtoryCost}' ,WorkShopCost = '${req.body.WorkShopCost}', processingCost = '${req.body.processingCost}' , preparationCost = '${req.body.preparationCost}' , standCosts = '${req.body.standCosts}', adminEmail = '${req.body.adminEmail}' where id = 1`;

        var query = conn.query(queryTxt, function (err, results) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(results));

            console.log("successfully");
        });
    });
});

var trackings = router.route("/api/trackings");
trackings.get(function (req, res, next) {
    console.log("init");

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        let queryTxt = `Select tracking.task,tracking.ipAddress,users.username,tracking.doneTime,vehicle.vehicleNumber 
                        from tracking 
                        join users on users.id = tracking.userId 
                        join vehicle on vehicle.id = tracking.vehicleId `;

        var query = conn.query(queryTxt, function (err, results) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(results));

            console.log("result trackings successfully");
        });
    });
});

var cat = router.route("/cat/:cat_title");
cat.get(function (req, res, next) {
    let cat_alias = req.params.cat_title;

    array = [];
    //res.send('');
    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        var query = conn.query("SELECT post.*,admins.gender,admins.name,admins.avatar,cat.alias FROM `post` JOIN admins ON post.creatorID=admins.id join cat on post.catID = cat.id where cat.title = ? ORDER BY createDate DESC LIMIT 3", cat_alias, function (err, rows) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            rows.forEach(async function (row) {
                row.createDate = moment(row.createDate, "YYYY-M-D HH:mm:ss")
                    .locale("fa")
                    .format("HH:mm YYYY/M/D");
            });

            res.render("cat", {
                title: "دسته" + " " + cat_alias, catTitle: cat_alias.split("-").join(" "), data: rows,
            });
        });
    });
});

cat.post(function (req, res, next) {
    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        let cat_title = req.params.cat_title;

        rw = parseInt(req.body.lmt);

        console.log(rw);

        var query = conn.query("SELECT post.*,admins.gender,admins.name,admins.avatar,cat.alias FROM `post` JOIN admins ON post.creatorID=admins.id join cat on post.catID = cat.id where cat.title = ? ORDER BY createDate DESC LIMIT ?,3", [cat_title, rw], function (err, rows) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            rows.forEach(async function (row) {
                row.createDate = moment(row.createDate, "YYYY-M-D HH:mm:ss")
                    .locale("fa")
                    .format("HH:mm YYYY/M/D");          });

            res.send(rows);

            // res.setHeader('Content-Type', 'application/json');
            // res.end(JSON.stringify({ data : rows }));
        });
    });
});

var users = router.route("/api/users/:userId?");

users.get(function (req, res, next) {
//return next("aliiii");
    console.log("init");

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");
 	 let sToken = req.body.token;
        let queryText = `select * from users where token = '${sToken}'`;
    
            var query = conn.query(queryText, function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }
    
                if (results.length==0 || results[0] == null) {
                    return next("OOPs!!, you are not Authorize");
                }
       var query2 = conn.query("Select * from users ", function (err2, results2) {
            if (err2) {
                console.log(err2);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(results2));

            console.log("get users successfully");
        }); 


           });	

 
    });
});

users.post(function (req, res, next) {
    console.log("init");

    debugger;

    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        //get data
        var data = {
            name: req.body.name,
            family: req.body.family,
            userName: req.body.userName,
            email: "",
            passWord: req.body.passWord,
            createDate: getDateNow(true).toString(),
            role: req.body.role,
        };

        var query = conn.query("INSERT INTO users set ? ", data, function (err, results, fields) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({state: true, id: results.insertId}));

            console.log("successfully");
        });
    });
});

users.put(function (req, res, next) {
    let queryTxt = "";

    const name = req.body.name;
    const family = req.body.family;
    const userName = req.body.userName;
    const passWord = req.body.passWord;
    const userId = req.body.userId;
    const role = req.body.role;

    console.log(role);

    (queryTxt = `UPDATE users SET name = '${name}' ,family = '${family}' ,username = '${userName}' , password = '${passWord}' , role = '${role}' WHERE id = ${userId}`), req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        var query = conn.query(queryTxt, function (err, results, fields) {
            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({state: true, id: results.insertId}));

            console.log("successfully");
        });
    });
});

users.delete(function (req, res, next) {
    req.getConnection(function (err, conn) {
        if (err) return next("Cannot Connect");

        if (req.body.userId.toString().includes(",")) {
            var query = conn.query("Delete from users Where id IN (?)", [req.body.userId], function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(results));

                console.log("successfully");
            });
        } else {
            var query = conn.query("Delete from users Where id = ?", parseInt(req.body.userId), function (err, results) {
                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({state: true}));

                console.log("successfully");
            });
        }
    });
});

let submitTracking = (token, task, req, vehicleId) => new Promise((resolve, reject) => {
    req.getConnection(function (err, conn) {
        let date_ob = new Date();
        console.log(date_ob);
        let userId = 0;
        let queryText = `select * from users where token = '${token}'`;

        var querySelectUser = conn.query(queryText, function (err, results) {
            let ipaddress = (req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(",")[0];
            if (!results || results[0] === undefined) return;
            let data = {
                userId: results[0].id || "debugg",
                task: task,
                ipAddress: ipaddress,
                doneTime: getDateNow(true),
                vehicleId: vehicleId,
            };

            var queryInsertActivity = conn.query("INSERT INTO tracking set ?", data, function (err, results) {
                console.log("submit activity");
            });

            resolve({msg: "It works", data: results[0]});
        });
    });
});

let getUser = (token, req) => new Promise((resolve, reject) => {
    // Do something with the params username and password...
    if (true) {
        /*setTimeout(()=> {*/
        // var token = token;
        let userId = 0;

        let queryText = `select * from users where token = '${token}'`;

        console.log(queryText);

        req.getConnection(function (err, conn) {
            if (err) return next("Cannot Connect");

            let date_ob = new Date();

            console.log(date_ob);

            var query = conn.query(queryText, function (err, results) {
                console.log("Result: " + results[0]);
                userId = parseInt(results[0].id);
                resolve({msg: "It works", data: results[0].id});
            });
        });

        /*}, 2000);*/
    } else {
        reject(Error("It didn't work!"));
    }
});

function sendSparePartsEmail(email) {
    let transporter = nodemailer.createTransport({
        host: "mail.fahrzeugtool.inosup.org", port: 587, secure: false, // true for 465, false for other ports
        auth: {
            user: "sparepart@fahrzeugtool.inosup.org", // generated ethereal user
            pass: "123456", // generated ethereal password
        },
    });

    const mailOptions = {
        from: "sparepart@fahrzeugtool.inosup.org",
        to: email,
        subject: "Spare part(s) is(are) Arrived",
        text: "Spare part(s) is(are) Arrived,pleas check panel.",
    };

    transporter.sendMail(mailOptions, (error, sent) => {
        if (error) {
            console.log("?????????????????????????????????????????????????????????", error);
        }
        if (sent) {
            console.log("?????????????????????????????????????????????????????????", sent);
        }
    });
}

function getDateNow(time = false) {
    const date_ob = new Date();

    const day = ("0" + date_ob.getDate()).slice(-2);
    const month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    const year = date_ob.getFullYear();

    if (!time) {
        const date = year + "-" + month + "-" + day;
        return date;
    } else {
        const hours = date_ob.getHours();
        const minutes = date_ob.getMinutes();
        const seconds = date_ob.getSeconds();
        const dateTime = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
        return dateTime;
    }
}

function toEnglishDigits(str) {
    // convert persian digits [۰۱۲۳۴۵۶۷۸۹]
    var e = "۰".charCodeAt(0);
    str = str.replace(/[۰-۹]/g, function (t) {
        return t.charCodeAt(0) - e;
    });

    // convert arabic indic digits [٠١٢٣٤٥٦٧٨٩]
    e = "٠".charCodeAt(0);
    str = str.replace(/[٠-٩]/g, function (t) {
        return t.charCodeAt(0) - e;
    });
    return str;
}

function generateId(length) {
    var randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var result = "";
    for (var i = 0; i < length; i++) {
        result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    return result;
}

function removeInvalidChars(str) {
    var ranges = ["\ud83c[\udf00-\udfff]", // U+1F300 to U+1F3FF
        "\ud83d[\udc00-\ude4f]", // U+1F400 to U+1F64F
        "\ud83d[\ude80-\udeff]", // U+1F680 to U+1F6FF
    ];
    return str.replace(new RegExp(ranges.join("|"), "g"), "");
}

function removeInvalidChars(str) {
    var ranges = ["\ud83c[\udf00-\udfff]", // U+1F300 to U+1F3FF
        "\ud83d[\udc00-\ude4f]", // U+1F400 to U+1F64F
        "\ud83d[\ude80-\udeff]", // U+1F680 to U+1F6FF
    ];
    return str.replace(new RegExp(ranges.join("|"), "g"), "");
}

//now we need to apply our router here
app.use("/", router);

//start Server
/*var server = app.listen(3333,'0.0.0.0',function(){
   console.log("Listening to port %s",server.address().port);
});*/

var server = app.listen(7437, function () {
    console.log("Listening to port %s", server.address().port);
});


