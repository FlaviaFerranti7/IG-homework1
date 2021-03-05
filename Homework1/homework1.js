"use strict";

var canvas;
var gl;

var numVertices  = 180; 

//Matrices
var rotationMatrix;
var projectionMatrix;
var viewMatrix;
var nRe_orientMatrix;

var program;

//for figure construction
var pointsArray = [];
var normalArray = [];
var skinTextureArray = [];

//implement rotation
var flag = false;
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta1 = [0, 0, 0];

//projection
var fovy = 45;
var aspect = 1.0;
var near = 2;  
var far = 20;
//viewer
var eye;
const cameraAt = vec3(0.0, 0.0, 0.0);
const cameraUp = vec3(0.0, 1.0, 0.0);

var radius = 7;
var theta = 0.4;
var phi = 2.5;
var dr = 5.0 * Math.PI/180.0;

//Light
var light_ambient = vec4(0.2, 0.2, 0.2, 1.0 );

//materials reflectivity
var material_ambient = vec4(0.8, 0.5, 0.47, 1.0);  //ambient and diffuse are similar
var material_diffuse = vec4(0.9, 0.8, 0.87, 1.0); 

//directional light
var dir_light_ambient = vec4(0.2, 0.1, 0.1, 1.0); //reflection of the directional light on the ambient
var dir_light_diffuse = vec4(0.5, 0.5, 0.5, 1.0);  
var dir_light_direction = vec4(2.0, 0.7, 2.0, 0.0); // w=0 because very far from the object considered at infinity

//spotlight
var spt_light_ambient = vec4( 0.1, 0.25, 0.45, 1.0);
var spt_light_diffuse = vec4( 0.4, 0.6, 0.1, 1.0);
var spt_light_position = vec4(1.0, 1.0, 1.0, 1.0); //at a finite distance w=1
var spt_light_direction = vec4(0.23, 0.3, 1.5, 0.0); //directions can be seen as points at infinity w=0
var spt_light_cutoff = 0.07;
var spt_exponent = 697.0;

//attenuation of light due to distance
var attenuation_constant = 1.0;
var attenuation_linear = 0.0;
var attenuation_quadratic = 0.0;

//texture
var text;
var texSize = 800; // max 1024
var image_skin = new Image();
image_skin.src = "skin_texture.jpg"
var flagt = true;

//cartoon
var flagC = true;

//coordinate for texture
var skinTexCoord = [
    vec2(0, 0),
    vec2(0, 0.5),
    vec2(0.5, 0.5),
    vec2(0.5, 0)
];

var bigfigTexCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var exTexCoord = [
    vec2(0, 0.5),
    vec2(0.0, 1.0),
    vec2(0.5, 1.0),
    vec2(0.5, 0)
];
var thumbTexCoord = [
    vec2(0.15, 0),
    vec2(0, 0.7),
    vec2(0.5, 0.7),
    vec2(0.35, 0)
];

var vertices = [
    vec4( -0.525, -1.75, 0.0, 1.0 ),  //0
    vec4( -0.525, 0.25, 0.0, 1.0 ),   //1
    vec4( 1.475, 0.25, 0.0, 1.0 ),    //2
    vec4( 1.475, -1.75, 0.0, 1.0 ),   //3
    vec4( -0.525, -1.75, -0.5, 1.0 ), //4
    vec4( -0.525, 0.25, -0.5, 1.0 ),  //5
    vec4( 1.475, 0.25, -0.5, 1.0 ),   //6
    vec4( 1.475, -1.75, -0.5, 1.0 ),  //7

    //second figure- thumb
    vec4( -0.425, 1.75, -0.2, 1.0 ),  //8
    vec4( -0.125, 1.75, -0.2, 1.0 ),  //9
    vec4( 0.075, 0.25, 0.0, 1.0 ),    //10
    vec4( -0.425, 1.75, -0.4, 1.0 ),  //11
    vec4( -0.125, 1.75, -0.4, 1.0 ),  //12
    vec4( 0.075, 0.25, -0.5, 1.0 ),   //13

    //third figure : fingers
    vec4( 0.875, -1.75, 0.4, 1.0 ), //14
    vec4( 0.875, 0.25, 0.4, 1.0 ),  //15
    vec4( 1.475, 0.25, 0.5, 1.0 ),  //16
    vec4( 1.475, -1.75, 0.5, 1.0 ), //17
    vec4( 0.325, -1.75, 0.0, 1.0 ), //18
    vec4( 0.325, 0.25, 0.0, 1.0 ),  //19

    //fourth figure : extension 
    vec4( -1.025, -1.75, 0.0, 1.0 ),   //20
    vec4( -1.025, -0.6, 0.0, 1.0 ),    //21
    vec4( -1.025, -1.75, -0.5, 1.0 ),  //22
    vec4( -1.025, -0.6, -0.5, 1.0 ),   //23
    
    //fifth figure : wrist
    vec4( -1.49, -1.75, 0.0, 1.0 ),   //24
    vec4( -1.49, -0.6, 0.0, 1.0 ),    //25
    vec4( -1.49, -1.75, -0.5, 1.0 ),  //26
    vec4( -1.49, -0.6, -0.5, 1.0 ),   //27
];

function quad(a, b, c, d) {

    //calculating normal for each face using 3 non collinear points  
    var v1 = subtract(vertices[b], vertices[a]);
    var v2 = subtract(vertices[c], vertices[b]);
    var normal = cross(v1, v2);
    normal = vec3(normal);
    
    pointsArray.push(vertices[a]);
    normalArray.push(normal);
    skinTextureArray.push(skinTexCoord[0]);

    pointsArray.push(vertices[b]);
    normalArray.push(normal);
    skinTextureArray.push(skinTexCoord[1]);

    pointsArray.push(vertices[c]);
    normalArray.push(normal);
    skinTextureArray.push(skinTexCoord[2]);

    pointsArray.push(vertices[a]);
    normalArray.push(normal);
    skinTextureArray.push(skinTexCoord[0]);

    pointsArray.push(vertices[c]);
    normalArray.push(normal);
    skinTextureArray.push(skinTexCoord[2]);

    pointsArray.push(vertices[d]);
    normalArray.push(normal);
    skinTextureArray.push(skinTexCoord[3]);
}

function thumb(a, b, c, d) {

    //calculating normal for each face using 3 non collinear points  
    var v1 = subtract(vertices[b], vertices[a]);
    var v2 = subtract(vertices[c], vertices[b]);
    var normal = cross(v1, v2);
    normal = vec3(normal);
    
    pointsArray.push(vertices[a]);
    normalArray.push(normal);
    
    pointsArray.push(vertices[b]);
    normalArray.push(normal);
    
    pointsArray.push(vertices[c]);
    normalArray.push(normal);
    
    pointsArray.push(vertices[a]);
    normalArray.push(normal);

    pointsArray.push(vertices[c]);
    normalArray.push(normal);

    pointsArray.push(vertices[d]);
    normalArray.push(normal);    

    if(a==12 && b==11 && c==8 && d==9){
        skinTextureArray.push(skinTexCoord[0]);
        skinTextureArray.push(skinTexCoord[1]);
        skinTextureArray.push(skinTexCoord[2]);        
        skinTextureArray.push(skinTexCoord[0]);    
        skinTextureArray.push(skinTexCoord[2]);
        skinTextureArray.push(skinTexCoord[3]);
    }
    else{
        skinTextureArray.push(thumbTexCoord[0]);
        skinTextureArray.push(thumbTexCoord[1]);
        skinTextureArray.push(thumbTexCoord[2]);      
        skinTextureArray.push(thumbTexCoord[0]);       
        skinTextureArray.push(thumbTexCoord[2]);
        skinTextureArray.push(thumbTexCoord[3]);

    }
}

function extension(a, b, c, d) {

    //calculating normal for each face using 3 non collinear points  
    
    var v1 = subtract(vertices[b], vertices[a]);
    var v2 = subtract(vertices[c], vertices[b]);
    var normal = cross(v1, v2);
    normal = vec3(normal);
    
    pointsArray.push(vertices[a]);
    normalArray.push(normal);

    pointsArray.push(vertices[b]);
    normalArray.push(normal);

    pointsArray.push(vertices[c]);
    normalArray.push(normal);
    
    pointsArray.push(vertices[a]);
    normalArray.push(normal);

    pointsArray.push(vertices[c]);
    normalArray.push(normal);

    pointsArray.push(vertices[d]);
    normalArray.push(normal);
    
    if (a==22 && b==23 && c==5 && d==4){
        skinTextureArray.push(exTexCoord[1]);
        skinTextureArray.push(exTexCoord[0]);
        skinTextureArray.push(exTexCoord[3]);        
        skinTextureArray.push(exTexCoord[1]);    
        skinTextureArray.push(exTexCoord[3]);
        skinTextureArray.push(exTexCoord[2]);
    }
    else if((a==5 && b==23 && c==21 && d==1) || (a==0 && b==20 && c==22 && d==4)){
        skinTextureArray.push(skinTexCoord[0]);
        skinTextureArray.push(skinTexCoord[1]);
        skinTextureArray.push(skinTexCoord[2]);        
        skinTextureArray.push(skinTexCoord[0]);    
        skinTextureArray.push(skinTexCoord[2]);
        skinTextureArray.push(skinTexCoord[3]);

    }
    else{
        skinTextureArray.push(exTexCoord[0]);
        skinTextureArray.push(exTexCoord[1]);
        skinTextureArray.push(exTexCoord[2]);        
        skinTextureArray.push(exTexCoord[0]);    
        skinTextureArray.push(exTexCoord[2]);
        skinTextureArray.push(exTexCoord[3]);
    }
}

function bigfig(a, b, c, d) {

    //calculating normal for each face using 3 non collinear points  
    var v1 = subtract(vertices[b], vertices[a]);
    var v2 = subtract(vertices[c], vertices[b]);
    var normal = cross(v1, v2);
    normal = vec3(normal);
    
    pointsArray.push(vertices[a]);
    normalArray.push(normal);
    skinTextureArray.push(bigfigTexCoord[0]);

    pointsArray.push(vertices[b]);
    normalArray.push(normal);
    skinTextureArray.push(bigfigTexCoord[1]);

    pointsArray.push(vertices[c]);
    normalArray.push(normal);
    skinTextureArray.push(bigfigTexCoord[2]);

    pointsArray.push(vertices[a]);
    normalArray.push(normal);
    skinTextureArray.push(bigfigTexCoord[0]);

    pointsArray.push(vertices[c]);
    normalArray.push(normal);
    skinTextureArray.push(bigfigTexCoord[2]);

    pointsArray.push(vertices[d]);
    normalArray.push(normal);
    skinTextureArray.push(bigfigTexCoord[3]);
}


function colorCube()
{
    bigfig( 1, 0, 3, 2 );  
    bigfig( 2, 3, 7, 6 );  
    bigfig( 3, 0, 4, 7 );   
    bigfig( 6, 5, 1, 2 );  
    bigfig( 4, 5, 6, 7 );   
    bigfig( 5, 4, 0, 1 );  

    thumb( 8, 1, 10, 9 );  
    thumb( 9, 10, 13, 12 );  
    thumb( 10, 1, 5, 13 );   
    thumb( 12, 11, 8, 9 );   
    thumb( 12, 13, 5, 11);   
    thumb( 11, 5, 1, 8 );    
    
    bigfig( 15, 14, 17, 16 );   
    bigfig( 16, 17, 3, 2 );    
    bigfig( 17, 14, 18, 3 );   
    bigfig( 2, 19, 15, 16 );  
    bigfig( 18, 19, 2, 3 );   
    bigfig( 19, 18, 14, 15 );   

    extension( 21, 20, 0, 1 );   
    extension( 1, 0, 4, 5 );   
    extension( 0, 20, 22, 4 );   
    extension( 5, 23, 21, 1 );    
    extension( 22, 23, 5, 4 );   
    extension( 23, 22, 20, 21);   

    quad( 25, 24, 20, 21 );   
    quad( 21, 20, 22, 23 );   
    quad( 20, 24, 26, 22 );   
    quad( 23, 27, 25, 21 );   
    quad( 26, 27, 23, 22 );   
    quad( 27, 26, 24, 25 ); 
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available" );

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );  

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //

    program = initShaders(gl, "vertex-shader", "fragment-shader" );
    gl.useProgram(program);

    colorCube();
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "aPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // normal buffer
    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalArray), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vNormal);

    //texture buffer
    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(skinTextureArray), gl.STATIC_DRAW);

    var vSkinTextCoord = gl.getAttribLocation(program, "aTexCoord");
    gl.vertexAttribPointer(vSkinTextCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vSkinTextCoord); 

    //send light ambient
    gl.uniform4fv( gl.getUniformLocation(program, "uWorldAmbient"), light_ambient );

    //send material reflectivity to shader
    gl.uniform4fv( gl.getUniformLocation(program, "umAmbient"), material_ambient );
    gl.uniform4fv( gl.getUniformLocation(program, "umDiffuse"), material_diffuse );

    //send directional light property
    gl.uniform4fv( gl.getUniformLocation(program, "uDirAmbient"), dir_light_ambient );
    gl.uniform4fv( gl.getUniformLocation(program, "uDirDiffuse"), dir_light_diffuse );
    gl.uniform4fv( gl.getUniformLocation(program, "uDirDirection"), dir_light_direction );

    //send spotlight light property
    gl.uniform4fv( gl.getUniformLocation(program, "uSptAmbient"), spt_light_ambient );
    gl.uniform4fv( gl.getUniformLocation(program, "uSptDiffuse"), spt_light_diffuse );
    gl.uniform4fv( gl.getUniformLocation(program, "uSptPosition"), spt_light_position);

    //texture
    text = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, text);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image_skin);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(gl.getUniformLocation( program, "uTexture"), 0);

    
    buttons();
    render();
}

var render = function() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //object transformation
    if(flag) theta1[axis] += 0.5;

    rotationMatrix = mat4();
   
    rotationMatrix = mult(rotationMatrix, rotateX(theta1[xAxis] ));
    rotationMatrix = mult(rotationMatrix, rotateY(theta1[yAxis]));
    rotationMatrix = mult(rotationMatrix, rotateZ(theta1[zAxis]));

    gl.uniformMatrix4fv( gl.getUniformLocation(program,
            "uInstanceMatrix"), false, flatten(rotationMatrix) );

    //viewer position
    viewMatrix = mat4();
    eye = vec3(radius*Math.sin(theta)*Math.cos(phi), radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));

    viewMatrix = lookAt(eye, cameraAt, cameraUp);
    //send modelview to vertex
    gl.uniformMatrix4fv(gl.getUniformLocation(program,
            "uViewMatrix"), false, flatten(viewMatrix));

    // projection matrices for view volume and camera lens
    projectionMatrix = perspective(fovy,aspect,near,far)
    //send projection matrix  
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjectionMatrix"), false, flatten(projectionMatrix));
    
    //re-orient the normals as the objet and the viewe is re-oriented
    nRe_orientMatrix = mat4();
    nRe_orientMatrix = mult(viewMatrix,rotationMatrix);
    nRe_orientMatrix = normalMatrix(nRe_orientMatrix, true);
    //send re-orientation normal to vertex
    gl.uniformMatrix3fv(gl.getUniformLocation(program, "uNormalMatrix"), false, flatten(nRe_orientMatrix));
    
    //controlling spotlight 
    gl.uniform1f( gl.getUniformLocation(program, "uSptCutoff"), spt_light_cutoff);
    gl.uniform4fv( gl.getUniformLocation(program, "uSptDirection"),spt_light_direction);
    
    //spotlight attenuation
    gl.uniform1f( gl.getUniformLocation(program, "uaConstant"), attenuation_constant);
    gl.uniform1f( gl.getUniformLocation(program, "uaLinear"), attenuation_linear);
    gl.uniform1f( gl.getUniformLocation(program, "uaQuadratic"), attenuation_quadratic);
    gl.uniform1f( gl.getUniformLocation(program, "uSptExponent"), spt_exponent);

    //controlling texture
    gl.uniform1f(gl.getUniformLocation(program, "flagTexture"), flagt);

    //controlling cartoon
    gl.uniform1f(gl.getUniformLocation(program, "flagCartoon"), flagC);

    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    requestAnimationFrame(render);
}

var buttons = function(){
    //event listeners for model rotation
    document.getElementById( "xButton" ).onclick = function () {
        if(!flag){
            flag = !flag
        }
        axis = xAxis;
    };
    document.getElementById( "yButton" ).onclick = function () {
        if(!flag){
            flag = !flag
        }
        axis = yAxis;
    };
    document.getElementById( "zButton" ).onclick = function () {
        if(!flag){
            flag = !flag
        }
        axis = zAxis;
    };
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};

    //eventlistener for perspective projection
    document.getElementById("Farp").onclick = function(){
        far += 0.5;
    };
    document.getElementById("Farm").onclick = function(){
        far -= 0.5;
    };
    document.getElementById("Nearp").onclick = function(){
        near += 0.5;
    };
    document.getElementById("Nearm").onclick = function(){
        near -= 0.5;
    };
    document.getElementById("Fovypm").oninput = function(){
         fovy = this.value;
    };
    document.getElementById( "Aspect+" ).onclick = function () {
        aspect += 0.5;
    };
    document.getElementById( "Aspect-" ).onclick = function () {
        aspect -= 0.5;
    };

     //buttons for viewer position

    document.getElementById( "Theta+" ).onclick = function () {
        theta += dr;
    };
    document.getElementById( "Theta-" ).onclick = function () {
        theta -= dr;
    };
    document.getElementById("Radiuspm").oninput = function(){
        radius = this.value;
   };
    document.getElementById( "Phi+" ).onclick = function () {
        phi += dr;
    };
    document.getElementById( "Phi-" ).onclick = function () {
        phi -= dr;
    };
    //texture
    document.getElementById("Texture").onclick = function(){
        flagt = !flagt;
        if(flagt == false){
            this.style.backgroundColor = "red";
        }
        else{
            this.style.backgroundColor = "rgb(16, 30, 223)";
        }
    };
    //spotlight
    document.getElementById("Cutoff").oninput = function(){
        spt_light_cutoff = this.value;
    };
    document.getElementById("x").oninput = function(){
        spt_light_direction[0] = this.value;
    };
    document.getElementById("y").oninput = function(){
        spt_light_direction[1] = this.value;
    };
    document.getElementById("attC").oninput = function(){
        attenuation_constant = this.value;
    };
    document.getElementById("attL").oninput = function(){
        attenuation_linear = this.value;
    };
    document.getElementById("attQ").oninput = function(){
        attenuation_quadratic = this.value;
    };
    document.getElementById("exp").oninput = function(){
        spt_exponent = this.value;
    };

    //cartoon
    document.getElementById("Cartoon").onclick = function(){
        flagC = !flagC;
        if(flagC == false){
            this.style.backgroundColor = "red";
            this.innerHTML = "Cartoon shade directional";
        }
        else{
            this.style.backgroundColor = "rgb(16, 30, 223)";
            this.innerHTML = "Cartoon shade";
        }
    }
}