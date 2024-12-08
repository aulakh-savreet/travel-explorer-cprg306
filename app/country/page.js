// app/country/page.js

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NewsList from '../components/NewsList';
import MapComponent from '../components/MapComponent';
import RegionSelector from '../components/RegionSelector';
import Image from 'next/image'; 

export default function CountryProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [country, setCountry] = useState(null);
  const [weather, setWeather] = useState(null);
  const [regionWeather, setRegionWeather] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [error, setError] = useState(null);
  const [loadingCountry, setLoadingCountry] = useState(false);
  const [loadingRegion, setLoadingRegion] = useState(false);

  useEffect(() => {
    if (!code) {
      setError('No country code provided.');
      return;
    }

    const fetchCountryData = async () => {
      setLoadingCountry(true);
      try {
        // Fetch country data
        const res = await axios.get(`https://restcountries.com/v3.1/alpha/${code}`);
        const countryData = res.data[0];
        setCountry(countryData);

        // Fetch weather data for the capital
        const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
        if (
          countryData.capitalInfo &&
          countryData.capitalInfo.latlng &&
          apiKey
        ) {
          const [lat, lon] = countryData.capitalInfo.latlng;
          const weatherRes = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather`,
            {
              params: {
                lat,
                lon,
                units: 'metric',
                appid: apiKey,
              },
            }
          );
          setWeather(weatherRes.data);
        }
      } catch (err) {
        console.error('Error fetching country data:', err);
        setError('Country not found.');
      } finally {
        setLoadingCountry(false);
      }
    };

    fetchCountryData();
  }, [code]);

  const handleSelectRegion = async (region) => {
    if (!region) {
      setError('No region selected.');
      return;
    }

    setSelectedRegion(region);
    setRegionWeather(null); 
    setError(null);
    setLoadingRegion(true);

    try {
      const query = `${region.name}, ${country.name.common}`;

      // Fetch coordinates using Nominatim API
      const geocodeRes = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          limit: 1,
        },
      });

      if (geocodeRes.data && geocodeRes.data.length > 0) {
        const { lat, lon } = geocodeRes.data[0];
        console.log(`Coordinates for ${query}: Latitude ${lat}, Longitude ${lon}`);

        // Fetch weather data using OpenWeatherMap
        const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
        if (apiKey) {
          const weatherRes = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather`,
            {
              params: {
                lat,
                lon,
                units: 'metric',
                appid: apiKey,
              },
            }
          );
          setRegionWeather(weatherRes.data);
        } else {
          setError('Weather API key is missing.');
        }
      } else {
        setError('Unable to find coordinates for the selected region.');
      }
    } catch (err) {
      console.error('Error fetching region weather data:', err.response || err.message || err);
      setError('Failed to load region weather data.');
    } finally {
      setLoadingRegion(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="container mx-auto flex-grow p-4">
          <div className="bg-red-100 text-red-700 p-4 rounded">
            <p>{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loadingCountry || !country) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="container mx-auto flex-grow p-4 flex justify-center items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral">
      <Header />
      <main className="container mx-auto flex-grow p-6">
        {/* Country Overview */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="md:flex">
            <div className="md:w-1/3">
              <Image
                src={country.flags.svg}
                alt={`${country.name.common} flag`}
                width={500} 
                height={300} 
                className="w-full h-64 object-cover"
                priority={false} 
              />
            </div>
            <div className="md:w-2/3 p-6">
              <h1 className="text-3xl font-bold mb-4">{country.name.common}</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <p><strong>Capital:</strong> {country.capital ? country.capital[0] : 'N/A'}</p>
                <p><strong>Region:</strong> {country.region}</p>
                <p><strong>Subregion:</strong> {country.subregion}</p>
                <p><strong>Population:</strong> {country.population.toLocaleString()}</p>
                <p><strong>Area:</strong> {country.area.toLocaleString()} km²</p>
                <p><strong>Languages:</strong> {country.languages ? Object.values(country.languages).join(', ') : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weather Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Capital Weather */}
          {weather && (
            <div className="bg-white shadow rounded-lg p-6 flex items-center">
              <Image
                src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                alt="Weather icon"
                width={80} // Specify appropriate width
                height={80} // Specify appropriate height
                className="w-20 h-20"
              />
              <div className="ml-4">
                <h2 className="text-2xl font-semibold">Weather in {country.capital[0]}</h2>
                <p className="text-gray-600 capitalize">{weather.weather[0].description}</p>
                <p className="text-gray-800 text-xl">{weather.main.temp} °C</p>
              </div>
            </div>
          )}

          {/* Region Weather */}
          {selectedRegion && regionWeather && (
            <div className="bg-white shadow rounded-lg p-6 flex items-center">
              <Image
                src={`http://openweathermap.org/img/wn/${regionWeather.weather[0].icon}@2x.png`}
                alt="Weather icon"
                width={80} 
                height={80} 
                className="w-20 h-20"
              />
              <div className="ml-4">
                <h2 className="text-2xl font-semibold">Weather in {selectedRegion.name}</h2>
                <p className="text-gray-600 capitalize">{regionWeather.weather[0].description}</p>
                <p className="text-gray-800 text-xl">{regionWeather.main.temp} °C</p>
              </div>
            </div>
          )}
        </div>

        {/* Region Selector */}
        <RegionSelector
          countryName={country.name.common} 
          onSelectRegion={handleSelectRegion}
        />

        {/* News Section */}
        <NewsList
          countryName={
            selectedRegion ? selectedRegion.name : country.name.common
          }
        />

        {/* Interactive Map */}
        <MapComponent
          latlng={
            selectedRegion && regionWeather
              ? [regionWeather.coord.lat, regionWeather.coord.lon]
              : country.capitalInfo && country.capitalInfo.latlng
              ? country.capitalInfo.latlng
              : [0, 0]
          }
          countryName={
            selectedRegion ? selectedRegion.name : country.name.common
          }
        />
      </main>
      <Footer />
    </div>
  );
}
