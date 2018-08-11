/* global noise */
'use strict'

function lerp(v0, v1, t) {
    return v0*(1-t)+v1*t
}

class Biome {
    constructor(color) {
        this.color = color;
        return this;
    }
}

let ocean = new Biome("blue");
let iceocean = new Biome("white");
let tundra = new Biome("white");
let colddessert = new Biome("grey");
let desert = new Biome("yellow");
let subdesert = new Biome("yellow");
let shrubland = new Biome("peru");
let borealforest = new Biome("darkseagreen");
let temprateseasonalforest = new Biome ("olivedrab");
let tempraterainforest = new Biome ("yellowgreen");
let savana = new Biome("olive");
let rainforest = new Biome("forestgreen");



let biomeGrid = [
    [tundra,tundra,colddessert,desert,desert,subdesert],
    [tundra,tundra,borealforest,desert,shrubland,savana],
    [tundra,tundra,borealforest,temprateseasonalforest,temprateseasonalforest,savana],
    [tundra,tundra,borealforest,temprateseasonalforest,temprateseasonalforest,savana],
    [tundra,tundra,borealforest,tempraterainforest,tempraterainforest,rainforest],
    [tundra,tundra,borealforest,tempraterainforest,tempraterainforest,rainforest]
]


function normalise(val,max,min) {
    return (val - min )/( max - min);
}

function denormalise(norm,max,min) {
    return norm * (max-min) + min;
}

class Hexagon {
    
    constructor(x,y,alt,abstemp,percipitation) {
        this.x = x;
        this.y = y;
        this.alt = alt;
        this.temp = abstemp;
        this.percipitation = percipitation;
        return this;
    }
    
    normalizeBiomeFactors(minTemp, maxTemp, minPercipitation, maxPercipitation) {
        this.normTemp = (this.temp - minTemp) / (maxTemp - minTemp);
        if(this.normTemp > 6) {
            this.normTemp = 5;
        } else if( this.normTemp < 0) {
            this.normTemp = 0;
        }
        this.normPercipitation = (this.percipitation - minPercipitation) /(maxPercipitation - minPercipitation);
        if(this.normPercipitation > 6) {
            this.normPercipitation = 5;
        } else if( this.normPercipitation < 0) {
            this.normPercipitation = 0;
        }
    }
    
    getBiomeTemp() {
        return Math.floor(this.normTemp*6);
    }
    
    getBiomePercipitation() {
        return Math.floor(this.normPercipitation*6);
    }
    
    isUnderWater() {
        return this.alt <= 0;
    }
    
    getBiome() {
        
        if(this.isUnderWater()) {
            if(this.getBiomeTemp() <= 1) {
                return iceocean;
            } else {
                return ocean;
            }
        }
        
        return biomeGrid[this.getBiomePercipitation()][this.getBiomeTemp()];
    }
}

class World {
    
    
    constructor(width,height,seed) {
        console.log("Working!");
        var smallHeightNoise = new SimplexNoise(seed + "height1");
        var largeHeightNoise = new SimplexNoise(seed + "height2");
        var affectHeightNoise = new SimplexNoise(seed + "height3");
        var tempNoise = new SimplexNoise(seed + "temp");
        var percNoise = new SimplexNoise(seed + "perc");
        this.maxTemp = 1;
        this.minTemp = 0;
        this.maxPerc = 1.0;
        this.minPerc = 0.0;
        
        this.hexGrid = [];
        for(var x = 0; x < width; x++) {
            this.hexGrid[x] = [];
            for(var y = 0; y < height; y++) {


                var trueX = x + (0.5 * y % 2);
                var trueY = y * 0.75 * (4/5);

                var longitude = (trueX / width) * Math.PI * 2;
                var latY = (trueY/(height*0.75)) * Math.PI * 2 - Math.PI;
                
                var latitude = (5/4) * Math.atan(Math.sinh((4*latY)/5));

                var x3 = Math.cos(latitude) * Math.cos(longitude) * 10;
                var y3 = Math.cos(latitude) * Math.sin(longitude) * 10;
                var z3 = Math.sin(latitude) * 10;

                var altSmallRawNoise = (smallHeightNoise.noise3D(x3/7,y3/7,z3/7) / 2) + 0.5; //[0,1]
                var altLargeRawNoise = (((largeHeightNoise.noise3D(x3/70,y3/70,z3/70) + 1)*0.9) - 1); //[-1,1]
                var altAffectRawNoise = (smallHeightNoise.noise3D(x3/70,y3/70,z3/70) / 2) + 0.5; //[0,1]
                var altRawNoise = altLargeRawNoise + lerp(altSmallRawNoise,0.5,altAffectRawNoise); //[-1,2]
                var altRaisedRawNoise = altRawNoise + 1; // [0,3]
                
                var altIslandMultiplicativeFactor = 1 ;// (0.5-((x/width-0.5)*(x/width-0.5) + (y/height-0.5)*(y/height-0.5)))*2; // [0,1]

                var alt = (altRaisedRawNoise * altIslandMultiplicativeFactor - 1.5)/1.5;//[-1,1]
                
                var tempRawNoise = tempNoise.noise3D(x3/70,y3/70,z3/70); // [-1,1]
                var tempShrunkNoise = (tempRawNoise / 2) + 1; // [0,1];

                var tempEquiterNormAddativeFactor = 2 - (Math.pow((Math.abs(y-(height/2))/height)*2,2) * 4); // [-2,2]
                var tempNoiseAndEquator = tempEquiterNormAddativeFactor + tempShrunkNoise; //[-3,5]

                var surfaceAltForTemp =  alt < 0 ? 0 : alt;
                var tempAltNormMultiplicativeFactor = Math.pow(1 - surfaceAltForTemp,0.8);


                
                var temp =  normalise(tempNoiseAndEquator,5,-3) * tempAltNormMultiplicativeFactor;

                var perc = ((percNoise.noise3D(x3/70,y3/70,z3/70) + 1.0)/ 2);
                /*if((perc > temp - this.minTemp)/(this.maxTemp-this.minTemp)*this.maxPerc) {
                    perc = this.maxPerc*(temp - this.minTemp)/(this.maxTemp-this.minTemp);
                }*/
                this.hexGrid[x][y] = new Hexagon(x,y,alt,temp,perc);
                this.hexGrid[x][y].normalizeBiomeFactors(this.minTemp,this.maxTemp,this.minPerc,this.maxPerc);
            }
        }
        return this;
    }
    
    getHexMap() {
        return this.hexGrid;
    }
}