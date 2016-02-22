function initMap() {
    var myLatLng = {
        lat: 40.7643033,
        lng: -74.00150859999999
    };

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: myLatLng
    });

    click_marker = new google.maps.Marker({
        position: myLatLng,
    });

    tour_markers = [
        new google.maps.Marker({position: null,map:map,label:"1"}),
        new google.maps.Marker({position: null,map:map,label:"2"}),
        new google.maps.Marker({position: null,map:map,label:"3"}),
        new google.maps.Marker({position: null,map:map,label:"4"})
    ];              
    
     var marker_img = {
        url: './circle.gif',
        // This marker is 20 pixels wide by 32 pixels high.
        size: new google.maps.Size(100, 100)
        // The origin for this image is (0, 0).
      };
    initial_markers = null;


    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;


}

function draw_marker(node_name) {
    if (initial_markers !== null){
        for (var i = 0; i < initial_markers.length; i++) {
            initial_markers[i].setMap(null);
        }
        initial_markers = null;
    }
    
    click_marker.setMap(null);
    var node_LatLng = {
        "lat": nodes[node_name][0],
        "lng": nodes[node_name][1]
    };
    var infoWindow = new google.maps.InfoWindow({
        content: node_name
    });

    var temp_marker = new google.maps.Marker({
        position: node_LatLng,
        map: map,
        title: node_name,
    });
    infoWindow.open(map, temp_marker);
    click_marker = temp_marker;
    map.setCenter(node_LatLng);

    //draw wordcloud
    $("#WCbox").attr("src","./wordCloud/"+node_name.replace(/[,/&-]/gi,"").replace(/'/gi,"").replace(/ /gi,"_")+".png");

}

function list_nodes(id, nodes_set) {
    var choosebox = $("#choosebox" + parseInt(id));
    for (i = 0; i < nodes_set.length; i++) {
        if (tour_markers_name.indexOf(nodes_set[i]) == -1){
            var option = $('<option/>');
            option.attr({
                'value': nodes_set[i]
            }).text(nodes_set[i]);
            choosebox.append(option);
        }
    }
}

function finalize(direction_mode) {

        waypts = [{
            location: tour_markers[1].position,
            stopover: true
        },{
            location: tour_markers[2].position,
            stopover: true
        },{
            location: tour_markers[3].position,
            stopover: true
        }];

    var message = null;
    var opt = null;
    if (direction_mode == "Default"){
        $("#Optimized").attr("disabled",false);
        $("#Default").attr("disabled",true);

        message = "Congratulations! Your own tour plan is just set!";
        $("#help_message").fadeOut("slow",function(){$("#help_message").text(message).fadeIn("slow").delay(2000).fadeOut("slow") });
        opt = false;

    }else{
        $("#Optimized").attr("disabled",true);
        $("#Default").attr("disabled",false);

        message = "Your tour plan is optimized regardless of the order";
        $("#help_message").fadeOut("slow",function(){$("#help_message").text(message).fadeIn("slow").delay(2000).fadeOut("slow") });
        opt = true;
    }

    var selected_mode = $(':radio[name="MOD"]:checked').val();

    directionsService.route({
        origin: tour_markers[0].position,
        destination: tour_markers[0].position,
        waypoints: waypts,
        optimizeWaypoints: opt,
        provideRouteAlternatives: true,
        travelMode: google.maps.TravelMode[selected_mode]
    }, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
            directionsDisplay.setMap(map);
            directionsDisplay.setPanel(document.getElementById('right-panel'));
            for (i = 0; i < 4; i++) tour_markers[i].setMap(null);

            var total_duration = 0;
            var total_distance = 0;
            for (var route in response.routes[0].legs){
                total_duration += response.routes[0].legs[route].duration.value;
                total_distance += response.routes[0].legs[route].distance.value;
            }
            var date = new Date(null);
            date.setSeconds(total_duration);
            var duration_format = date.toISOString().substr(11, 2) + "hours "+ date.toISOString().substr(14, 2) +"mins";

            $("#total_result").text(total_distance/1000+"km in " +duration_format );

        } else {
            var message = "Soory, please try with other type of mode of travel";
            $("#help_message").fadeOut("slow",function(){$("#help_message").text(message).fadeIn("slow") });
        }
    });
} 

function button_change(id) {
    var button_obj = document.getElementById("select" + id);
    var message = null;
    click_marker.setMap(null);
    if (button_obj.innerText == "select") {
        var selected_node = $("#choosebox" + id + " option:selected").attr("value");
        if (selected_node == null) {
            message = "Please select at least one option!";
            $("#help_message").fadeOut("slow",function(){$("#help_message").text(message).fadeIn("slow").delay(1500).fadeOut("slow") });
        
        } else {
            if (nodes_pair[selected_node] == null) {
                message = "Sorry this node is not connected to anywhere";
                $("#help_message").fadeOut("slow",function(){$("#help_message").text(message).fadeIn("slow").delay(1500).fadeOut("slow") });
            } else {
                var next_nodes = Object.keys(nodes_pair[selected_node]);
                list_nodes(parseInt(id) + 1, next_nodes);
            }
            button_obj.innerHTML = "cancel";
            document.getElementById("choosebox" + id).disabled = true;

            if (parseInt(id) > 1) document.getElementById("select" + (parseInt(id) - 1)).disabled = true;
            $("#outer_box" + (parseInt(id) + 1)).slideToggle("slow");

            //Draw tourmark
            var LatLng = { lat: click_marker.position.lat(), lng: click_marker.position.lng()};
            tour_markers[parseInt(id)-1].setPosition(LatLng);
            tour_markers[parseInt(id)-1].setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function(){ tour_markers[parseInt(id)-1].setAnimation(null); }, 1750);

            tour_markers_name.push(click_marker.getTitle());

            if(id =="4") finalize("Default");
        }
    } else {
        $("#choosebox" + (parseInt(id) + 1) + " option").remove();

        button_obj.innerText = "select";
        document.getElementById("choosebox" + id).disabled = false;
        if (parseInt(id) > 1) document.getElementById("select" + (parseInt(id) - 1)).disabled = false;
        $("#outer_box" + (parseInt(id) + 1)).slideToggle("slow");

        //Remove tourmark
        tour_markers[parseInt(id)-1].setPosition(null);
        tour_markers_name.pop();

        if(id =="4") {
            directionsDisplay.setMap(null);
            for (i = 0; i < 4; i++) tour_markers[i].setMap(map);
            document.getElementById('right-panel').innerHTML = null;
            $("#Optimized").attr("disabled",true);
            $("#Default").attr("disabled",true);
            $("#total_result").text("");
        }
    }
}

function change_PRF(id){
    nodes_pair = nodes_pair_set[parseInt(id)];
    var message = "We will recommend you a next tour spot mostly based on "+$("input[name='PRF']")[parseInt(id)].title+" similarity";
    $("#help_message").fadeOut("slow",function(){$("#help_message").text(message).fadeIn("slow") });        
}


