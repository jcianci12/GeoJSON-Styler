#context:
This is an angular app.
README.md has more context
1. Currently, a user needs to upload geojson and a csv file to 'join' a geojson object, with a css style to show the object on a map. The user would select what column to 'join' on. For example a suburb column. The app will look at the csv data and check if any GeoJSON objects match on the join column. If there is, the app will try and render that object on the map.

#TODO
1. Lets make it so that a user can just upload a csv to the map. We will need a component to allow the user to select the lat and lng cols (auto select if the headers are either 'lat' 'latitude' etc). once the columns are selected, render the points on the map. Make sure that the existing method of rendering geoJSON data on the map still works. It might be that we need to make things more modular to keep things working the same. Try to reuse components and use the DRY principle.
2. building on point 1, add a way to toggle the csv between point data and joining data - aka data we need to join to a geojson daataset. Lets allow the csv to have stying data, and then we can select what column does what. eg. colour, styles the colour of the point. etc.
3. Lets mod the app so we can toggle between geojson layer with a join and pure points data (just a csv)