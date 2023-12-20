import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom"
import Perks from "../Perks";
import axios from "axios";
import PhotosUploader from "../PhotosUploader";
import AccountNav from "./AccountNav";
import PlaceImg from "../PlaceImg";
// import axios from "axios"



const PlacesPage = () => {
  const [places, setPlaces] = useState([])
  useEffect(() => {
    axios.get('/user-places').then(({data}) => {
      setPlaces(data)
    })
  },[])

  async function deletePlace(placeId) {
    try {
      await axios.delete(`/delete-place/${placeId}`);
      console.log("Place deleted successfully");

      updatePlacesAfterDeletion(placeId)
    } catch (error) {
      console.error("Error deleting place:", error);
    }
  }

  function updatePlacesAfterDeletion(deletedPlaceId) {
    setPlaces(prevPlaces => prevPlaces.filter(place => place._id !== deletedPlaceId));
  }
  

  // console.log(places)
  return (
    <div>
      <AccountNav />      
        <div className=" text-center">
        <Link className=" inline-flex gap-1 bg-primary text-white py-2 px-6 rounded-full" to={'/account/places/new'}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add new place
        </Link>
      </div>
      <div className=" mt-4">
        {places.length && places.map(place => (
          <div className=" flex gap-4 bg-gray-100 p-4 rounded-2xl relative" key={place._id}>
            <Link to={'/account/places/'+place._id} className=" flex w-32 h-32 bg-gray-300 shrink-0 cursor-pointer">
              <PlaceImg place={place} />
            </Link>
            <div className=" grow-0 shrink">
              <h2 className=" text-xl"> {place.title} </h2> 
              <p className=" text-sm mt-2">{place.description}</p>
            </div>
            <div onClick={() => deletePlace(place._id)} className=" absolute sm:right-5 hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PlacesPage