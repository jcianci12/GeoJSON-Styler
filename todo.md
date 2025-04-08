#context:
This is an angular app.
README.md has more context
1. Currently, a user needs to upload geojson and a csv file to 'join' a geojson object, with a css style to show the object on a map. The user would select what column to 'join' on. For example a suburb column. The app will look at the csv data and check if any GeoJSON objects match on the join column. If there is, the app will try and render that object on the map.

#TODO
1. Lets make it so that a user can just upload a csv to the map. We will need a component to allow the user to select the lat and lng cols (auto select if the headers are either 'lat' 'latitude' etc). once the columns are selected, render the points on the map. Make sure that the existing method of rendering geoJSON data on the map still works. It might be that we need to make things more modular to keep things working the same. Try to reuse components and use the DRY principle.