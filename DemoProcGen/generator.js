/* global noise */
'use strict'

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
        this.normPercipitation = (this.percipitation - minPercipitation) /(maxPercipitation - minPercipitation);
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
            if(this.getBiomeTemp() == 0) {
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
        var heightNoise = new SimplexNoise(seed + "height");
        var tempNoise = new SimplexNoise(seed + "temp");
        var percNoise = new SimplexNoise(seed + "perc");
        this.maxTemp = 0.88;
        this.minTemp = -0.52;
        this.maxPerc = 1.0;
        this.minPerc = 0.0;
        
        this.hexGrid = [];
        for(var x = 0; x < width; x++) {
            this.hexGrid[x] = [];
            for(var y = 0; y < height; y++) {
                var trueX = x + (0.5 * y % 2);
                var trueY = y * 0.75;
                
                
                
                var alt = ((heightNoise.noise2D(trueX/70,trueY/70) + 1) * (0.5-((x/width-0.5)*(x/width-0.5) + (y/height-0.5)*(y/height-0.5)))*2)-1;
                var temp = ((tempNoise.noise2D(trueX/70,trueY/70) + 0.9)/5.0) - alt + 0.5; 
                var perc = ((percNoise.noise2D(trueX/70,trueY/70) + 1.0)/ 2) * (temp - this.minTemp)/(this.maxTemp-this.minTemp);
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