import logik from "./logik.js";
// import ordre from "ordre.js"

//laver express server.
const port = 6969;
import express from "express"; //Ændret til import. ved brug af firebase
const app = express();
import session from "express-session";


//Opretter view.
let pug = import("pug");
import path from "path";
const { request } = import("http");
const { response } = import("express");
app.set("view engine", "pug");
app.set("views", "views/");

app.use(express.json());
app.use(session({ secret: 'hemmelig', saveUninitialized: true, resave: true }));



//Importer til __DirName
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

//Firebase filer.
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    deleteDoc,
    addDoc,
    setDoc,
    getDoc,
    query,
    where,
    updateDoc,
} from "firebase/firestore";
import { Console } from "console";
import { get } from "http";
import { DefaultDeserializer } from "v8";
//import{storage} from 'firebase/storage'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCwMpbafG7AkNlU28omo8MDhA7ZgIh7BlA",
    authDomain: "papersign-19cd5.firebaseapp.com",
    projectId: "papersign-19cd5",
    storageBucket: "papersign-19cd5.appspot.com",
    messagingSenderId: "477663863462",
    appId: "1:477663863462:web:f765c4665f9f0610fd4a67",
};

// Initialize Firebase
const appFireBase = initializeApp(firebaseConfig);
const db = getFirestore(appFireBase);

// Initialize Server Storage
// let produkter = await getAllProducts();
// let produktgrupper = await getAllProductgroups();
let fakturaer = await getAllFakturaer();
// let ordrer = await getAllOrdrer();
// let ProduktInProduktGoup = [];
// let kurv = [];
// let pgid = -1;
// let total = 0;
let valgtGruppeNrS;
let valgtProduktNrS;
// let betalt = 0;
// let betallinger = [];
// let darkmode = true;


async function getAllOrdrer() {
    let fakturaCollection = collection(db, "ordrer");
    let ordrer = await getDocs(fakturaCollection);
    let liste = ordrer.docs.map((doc) => {
        let data = doc.data();
        data.docID = doc.id;
        return data;
    });
    return liste;
}

//Numre til id af produkter og produktgrupper. 
let result = await getAllNumbers();
let gruppeNr = result[1].gruppeNr;
let produktNr = result[3].produktNr;
// let ordreNr = result[2].ordreNr;
// let fakturaNR = result[0].fakturaNr;

async function getAllFakturaer() {
    let fakturaCollection = collection(db, "fakturaer");
    let collection1 = await getDocs(fakturaCollection);
    let liste = collection1.docs.map((doc) => {
        let data = doc.data();
        data.docID = doc.id;
        return data;
    });
    return liste;
}
async function getAllProductgroups() {
    let gruppeCollection = collection(db, "produktgrupper");
    let varegruppper = await getDocs(gruppeCollection);
    let liste = varegruppper.docs.map((doc) => {
        let data = doc.data();
        data.docID = doc.id;
        return data;
    });
    return liste;
}

// henter numre til varenumre, gruppenumre osv. (Dette er deres "id" inde på firebase)
async function getAllNumbers() {
    let gruppeCollection = collection(db, "nummre");
    let nummre = await getDocs(gruppeCollection);
    let liste = nummre.docs.map((doc) => {
        let data = doc.data();
        data.docID = doc.id;
        return data;
    });
    return liste;
}

// henter alle produkter, fra firebase og putter dem ind i et "lokalt" array
async function getAllProducts() {
    let varerCollection = collection(db, "varer");
    let varer = await getDocs(varerCollection);
    let vareliste = varer.docs.map((doc) => {
        let data = doc.data();
        data.docID = doc.id;
        return data;
    });
    return vareliste;
}

// forsiden (Kasseapparatet)
app.get("/", async (request, response) => {
    let pg = request.session.produktgrupper;
    if (pg == undefined) {
        pg = await getAllProductgroups();
    }
    request.session.produktgrupper = pg;
    let p = request.session.produkter;
    if (p == undefined) {
        p = await getAllProducts();
    }
    request.session.produkter = p
    response.render("underskrift", { produkter: p, produktgrupper: pg });
});

// opretter en produktgruppe med et unikt gruppeNr og opdaterer "numre" 
// i firebase, så næste produktgruppe også får et unikt nummer
app.post("/opretProduktGruppe", async (request, response) => {
    const { produktGruppeNavn, produktGruppeBeskrivelse } = request.body;
    let nyProduktGruppe = logik.createProductgroup(produktGruppeNavn, produktGruppeBeskrivelse, gruppeNr)
    produktgrupper.push(nyProduktGruppe)
    let nyProduktGruppeFirebase = { navn: produktGruppeNavn, beskrivelse: produktGruppeBeskrivelse, gruppeNr: gruppeNr }
    await setDoc(doc(db, "produktgrupper", `${gruppeNr}`), nyProduktGruppeFirebase)
    gruppeNr++;
    let gruppenrUpdate = { gruppeNr: gruppeNr }
    await setDoc(doc(db, "nummre/gruppeNr"), gruppenrUpdate)
    valgtGruppeNrS = undefined;
    response.sendStatus(201);
});

// sletter en produktgruppe
app.post('/deleteProductGroup', async (request, response) => {
    const { aktuelGroupNr } = request.body;
    await deleteDoc(doc(db, 'produktgrupper', aktuelGroupNr));
    response.sendStatus(201)
    valgtGruppeNrS = undefined;
})
// opdaterer en produktgruppe
app.post('/updateProduktGroup', async (request, response) => {
    const { aktuelGroupNr, produktGruppeNavn, produktGruppeBeskrivelse } = request.body;
    let updatetProduktGroup = { navn: produktGruppeNavn, beskrivelse: produktGruppeBeskrivelse, gruppeNr: aktuelGroupNr }
    await setDoc(doc(db, "produktgrupper/" + aktuelGroupNr), updatetProduktGroup)
    valgtGruppeNrS = undefined;
    response.sendStatus(201)
})

// opretter et produkt, i firebase og giver det et produktnummer
// opdaterer "produktnumre" inde i firebase, så næste produkt får et nyt unikt nr
app.post("/opretProdukt", async (request, response) => {
    const { gruppeNr, produktNavn, produktPris, produktAntal, leveradør, bestillingsnummer } = request.body;
    let nyProdukt = logik.createProduct(produktNavn, produktPris, produktAntal, leveradør, bestillingsnummer, gruppeNr, produktNr)
    produkter.push(nyProdukt)
    let ProduktInProduktGoup = request.session.ProduktInProduktGoup || [];
    ProduktInProduktGoup.push(nyProdukt)
    let nyProduktFirebase = { gruppeNr: gruppeNr, navn: produktNavn, pris: produktPris, antal: produktAntal, leveradør: leveradør, bestillingsnummer: bestillingsnummer, produktNr: produktNr }
    await setDoc(doc(db, "varer", `${produktNr}`), nyProduktFirebase)
    produktNr++;
    let produktnrUpdate = { produktNr: produktNr }
    await setDoc(doc(db, "nummre/produktNr"), produktnrUpdate)
    valgtProduktNrS = undefined;
    response.sendStatus(201);
});

// sletter et produkt
app.post('/deleteProdukt', async (request, response) => {
    const { aktuelProduktNr } = request.body;
    await deleteDoc(doc(db, 'varer', aktuelProduktNr + ""));
    let ProduktInProduktGoup = request.session.ProduktInProduktGoup || [];
    //Her finder jeg hvor i arrayet produkterne befinder sig og sletter dem. 
    for (let i = 0; i < produkter.length; i++) {
        if (produkter[i].produktNr == aktuelProduktNr) {
            produkter.splice(i, 1);
        }
        for (let i = 0; i < ProduktInProduktGoup.length; i++) {
            if (ProduktInProduktGoup[i].produktNr == aktuelProduktNr) {
                ProduktInProduktGoup.splice(i, 1);
            }
        }
    }
    valgtProduktNrS = undefined;
    response.sendStatus(201)
})
// opdaterer et produkt i firebase
app.post('/updateProdukt', async (request, response) => {
    const { aktuelProduktNr, gruppeNr, produktNavn, produktPris, produktAntal, leveradør, bestillingsnummer } = request.body;
    let updatetProdukt = { gruppeNr: gruppeNr, navn: produktNavn, pris: produktPris, antal: produktAntal, leveradør: leveradør, bestillingsnummer: bestillingsnummer, produktNr: aktuelProduktNr }
    await setDoc(doc(db, "varer/" + aktuelProduktNr), updatetProdukt)
    let ProduktInProduktGoup = request.session.ProduktInProduktGoup || [];

    //Her finder jeg hvor i arrayet produkterne befinder sig og opdatere dem. 
    for (let i = 0; i < produkter.length; i++) {
        if (produkter[i].produktNr == aktuelProduktNr) {
            produkter[i] = { gruppeNr: gruppeNr, navn: produktNavn, pris: produktPris, antal: produktAntal, leveradør: leveradør, bestillingsnummer: bestillingsnummer, produktNr: aktuelProduktNr }
        }
    }
    for (let i = 0; i < ProduktInProduktGoup.length; i++) {
        if (ProduktInProduktGoup[i].produktNr == aktuelProduktNr) {
            ProduktInProduktGoup[i] = { gruppeNr: gruppeNr, navn: produktNavn, pris: produktPris, antal: produktAntal, leveradør: leveradør, bestillingsnummer: bestillingsnummer, produktNr: aktuelProduktNr }
        }
    }
    valgtProduktNrS = undefined;
    response.sendStatus(201)
})

// sender brugeren over på "underskrift" siden
// bruges når man vælger "underskrift" som betalingsmetode, i kassen
app.get("/underskrift", async (request, response) => {
    let pg = request.session.produktgrupper;
    if (pg == undefined) {
        pg = await getAllProductgroups();
    }
    request.session.produktgrupper = pg;
    let p = request.session.produkter;
    if (p == undefined) {
        p = await getAllProducts();
    }
    request.session.produkter = p
    let fakturaNR = request.session.fakturaNr;
    if (fakturaNR == undefined) {
        let result = await getAllNumbers();
        fakturaNR = result[0].fakturaNr;
    }
    request.session.fakturaNr = fakturaNR;

    let fakturaer = await getAllFakturaer();
    let ordrer = await getAllOrdrer();




    response.render("underskrift", { ordrer: ordrer, fakturaer: fakturaer, produktgrupper: pg, produktliste: p, fakturaNr: fakturaNR });
});
// opdaterer fakturanummer, så den har et unikt ordrenummer
app.post("/underskrift", async (request, response) => {
    let fakturanrUpdate = { fakturaNR: fakturaNR }
    fakturaNR++;
    await setDoc(doc(db, "nummre/fakturaNr"), fakturanrUpdate)
    response.sendStatus(201);
})
// henter CRUD siden (create, update, remove, delete) af:
// produkter, produktgrupper
app.get("/crud/", async (request, response) => {
    let pg = request.session.produktgrupper;
    if (pg == undefined) {
        pg = await getAllProductgroups();
    }
    request.session.produktgrupper = pg;
    let p = request.session.produkter;
    if (p == undefined) {
        p = await getAllProducts();
    }
    request.session.produkter = p
    let ProduktInProduktGoup = request.session.ProduktInProduktGoup || [];

    let fromSearch = "0"
    response.render("crud", { fakturaer: fakturaer, produktgrupper: pg, produkter: p, ProduktInProduktGoup: ProduktInProduktGoup, valgtGruppeNr: valgtGruppeNrS, valgtProduktNr: valgtProduktNrS, fromSearch: fromSearch });
});
// siden til at komme ind på crud, på et specifikt produkt (via søgning)
app.get("/crud/:id&:id2", async (request, response) => {
    let valgtGruppeNrS = request.session.valgtGruppeNrS;
    if (valgtGruppeNrS == undefined) {
        valgtGruppeNrS = request.params.id;
    }
    request.session.valgtGruppeNrS = valgtGruppeNrS;

    let valgtProduktNrS = request.session.valgtProduktNrS
    if (valgtProduktNrS == undefined) {
        valgtProduktNrS = request.params.id2;
    }
    request.session.valgtProduktNrS = valgtProduktNrS;

    let pg = request.session.produktgrupper;
    if (pg == undefined) {
        pg = await getAllProductgroups();
    }
    request.session.produktgrupper = pg;

    let p = request.session.produkter;
    if (p == undefined) {
        p = await getAllProducts();
    }
    request.session.produkter = p

    // valgtGruppeNrS = request.params.id;
    // valgtProduktNrS = request.params.id2
    let ProduktInProduktGoup = request.session.ProduktInProduktGoup || [];

    ProduktInProduktGoup = searchProductByGroupNr(valgtGruppeNrS, p)
    let fromSearch = "1"
    response.render("crud", { fakturaer: fakturaer, produktgrupper: pg, produkter: p, ProduktInProduktGoup: ProduktInProduktGoup, valgtGruppeNr: valgtGruppeNrS, valgtProduktNr: valgtProduktNrS, fromSearch: fromSearch });
});
// siden til at komme ind på en specifik ordre (fundet via "faktura" oversigten)
app.get("/ordre/:data", async (request, response) => {
    let pg = request.session.produktgrupper;
    if (pg == undefined) {
        pg = await getAllProductgroups();
    }
    // request.session.produktgrupper = pg;
    // let p = request.session.produkter;
    // if (p == undefined) {
    //     p = await getAllProducts();
    // }
    // request.session.produkter = p

    // let odre = request.session.produkter;
    // if (p == undefined) {
    //     p = await getAllProducts();
    // }
    // request.session.produkter = p

    // let p = request.session.produkter;
    // if (p == undefined) {
    //     p = await getAllProducts();
    // }
    // request.session.produkter = p

    let ordreID = request.params.data;
    let specifikOrdre = getOrdre(ordreID);
    response.render("ordre", { specifikOrdre, ordrer: ordrer, fakturaer: fakturaer, produktgrupper: pg, produktliste: p });
});
// viser alle ordrer (fakturaer)
app.get("/faktura/", async (request, response) => {
    let pg = request.session.produktgrupper;
    if (pg == undefined) {
        pg = await getAllProductgroups();
    }
    request.session.produktgrupper = pg;
    let p = request.session.produkter;
    if (p == undefined) {
        p = await getAllProducts();
    }
    request.session.produkter = p
    let date = request.query.ordreDate
    // gets today if undefined
    if (date == undefined) {
        let tempDate = new Date;
        let day = tempDate.getDate();
        let month = tempDate.getMonth() + 1;
        let year = tempDate.getFullYear();
        if (day < 10) {
            day = "0" + day
        }
        if (month < 10) {
            month = "0" + month
        }
        date = year + "-" + month + "-" + day
    }
    request.session.date = date
    let ordrer = await getAllOrdrer();
    let ordreByDate = getOrdreByDate(date,ordrer);
    let fakturaer = await getAllFakturaer();
    response.render("faktura", { date: date, ordrer: ordreByDate, fakturaer: fakturaer, produktgrupper: pg, produktliste: p });
});

function getOrdreByDate(date, ordrer) {
    let tempDateArray = date.split('-')
    let tempDate = "" + Number(tempDateArray[2]) + "-" + Number(tempDateArray[1]) + "-" + tempDateArray[0];
    let ordreArray = [];
    for (let f of ordrer) {
        if (f.dato == tempDate) {
            ordreArray.push(f);
        }
    }
    return ordreArray;
}

// finder produkterne, som tilhører et specifikt produktgruppenummer
app.post("/seachProduktinGroup", async (request, response) => {
    const { valgtGruppeNr } = request.body;
    let p = request.session.produkter;
    if (p == undefined) {
        p = await getAllProducts();
    }
    request.session.produkter = p;
    let ProduktInProduktGoup = request.session.ProduktInProduktGoup || [];
    ProduktInProduktGoup = searchProductByGroupNr(valgtGruppeNr, p)
    valgtGruppeNrS = valgtGruppeNr;
    valgtProduktNrS = undefined;
    response.sendStatus(201);
})

app.post("/aktuelProduktNrTilServer", async (request, response) => {
    const { aktuelProduktNr } = request.body;
    valgtProduktNrS = aktuelProduktNr;
    response.sendStatus(201);
})

// søgesiden, viser søgeresultaterne fra søgefeltet
app.get("/search", async (request, response) => {
    let p = request.session.produkter;
    if (p == undefined) {
        p = await getAllProducts();
    }
    request.session.produkter = p
    var attribut = request.query.atribut;
    var vaerdi = request.query.value;
    let searchresults = await logik.searchDynamic(p, attribut, vaerdi);
    response.render("search", { search: searchresults });
});

// porten til serveren (port 6969)
app.listen(port);


//Metoder--------------------------------------------------------------------------------------------------------------------------------------------------

function searchProductByGroupNr(gruppeNr, produkter) {
    //if gruppeNr == visalt return all products
    if (gruppeNr == "visalt") return produkter;
    let list = [];
    //let products = getProducts() // hent alle produkterne, i arrayet "produkter" fra server.js - måske navnet er forkert, eller også er der ingen getProducts, til den?)
    for (let i = 0; i < produkter.length; i++) {
        if (produkter[i].gruppeNr == gruppeNr) {
            list.push(produkter[i]);
        }
    }
    return list;
}

// Returns an index of an product for an given value
// Returns an index or false
// Used in ("kasseslet, kasserabat, addToKurv") to find the index of a given product in the cart
// TODO merge containsOrdre and findIndexOfProduct, becuase they do the same.. 
function containsOrdre(searchvalue) {
    let tempkurv = kurv;
    let found = false;
    let index = 0
    while (found === false && index < tempkurv.length) {
        let obj = tempkurv[index]
        if (obj.navn == searchvalue) {
            //changes found to i (index)
            found = index;
        }
        else index++;
    }
    return found;
}

console.log("Serveren er startet op. Lytter på port " + port);