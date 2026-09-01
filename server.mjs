import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());


app.get("/", (req,res)=>{
    res.send("AI Export Lead Finder API Running");
});


app.get("/health",(req,res)=>{
    res.json({
        status:"ok"
    });
});


app.post("/find-leads",(req,res)=>{

    const {product,country}=req.body;


    const leads=[
        {
            company:"Global Import Solutions",
            country:country || "USA",
            type:"Importer",
            email:"contact@example.com",
            score:"★★★★★"
        },
        {
            company:"International Trading Co",
            country:country || "Germany",
            type:"Distributor",
            email:"sales@example.com",
            score:"★★★★☆"
        }
    ];


    res.json({
        product,
        leads
    });

});


app.listen(3000,()=>{
    console.log("server running");
});
