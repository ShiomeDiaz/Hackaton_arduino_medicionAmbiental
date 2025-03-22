import { useEffect, useState } from "react";
import mqtt from "mqtt";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// 🔹 Configuración de topics MQTT
const MQTT_BROKER = "wss://test.mosquitto.org:8081/mqtt";
const TOPICS = {
  temp: "esp32/dht22/temperatura",
  hum: "esp32/dht22/humedad",
  o2Raw: "esp32/o2/raw",
  o2Percent: "esp32/o2/percent",
  luxRaw: "esp32/temt6000/lux_raw",
  luxEst: "esp32/temt6000/lux_est",
  uvRaw: "esp32/uv/raw",
  uvPower: "esp32/uv/uWcm2",
  soundRaw: "esp32/sound/raw",
  soundDB: "esp32/sound/db_est",
  scdCo2: "esp32/scd41/co2",
  scdTemp: "esp32/scd41/temp",
  scdHum: "esp32/scd41/hum",
  co: "esp32/gas/co",
  no2: "esp32/gas/no2",
  etanol: "esp32/gas/etanol",
  nh3: "esp32/gas/nh3",
  ch4: "esp32/gas/ch4",
  bmpTemp: "esp32/bmp280/temp",
  bmpPresion: "esp32/bmp280/presion",
  ubicacion: "esp32/ubicacion"
};

function App() {
  const [data, setData] = useState({
    temp: "---",
    hum: "---",
    o2Raw: "---",
    o2Percent: "---",
    luxRaw: "---",
    luxEst: "---",
    uvRaw: "---",
    uvPower: "---",
    soundRaw: "---",
    soundDB: "---",
    scdCo2: "---",
    scdTemp: "---",
    scdHum: "---",
    co: "---",
    no2: "---",
    etanol: "---",
    nh3: "---",
    ch4: "---",
    bmpTemp: "---",
    bmpPresion: "---",
    ubicacion: null
  });

  useEffect(() => {
    const client = mqtt.connect(MQTT_BROKER);

    client.on("connect", () => {
      Object.values(TOPICS).forEach((topic) => client.subscribe(topic));
    });

    client.on("message", (topic, message) => {
      const value = message.toString();
      setData((prev) => {
        const updated = { ...prev };
        for (const key in TOPICS) {
          if (TOPICS[key] === topic) {
            if (key === "ubicacion") {
              try {
                const [lat, lon] = value.split(",").map(parseFloat);
                updated[key] = { lat, lon };
              } catch (err) {
                console.error("❌ Error procesando ubicación:", value);
              }
            } else {
              updated[key] = value;
            }
          }
          
        }
        return updated;
      });
    });

    client.on("error", (err) => console.error("MQTT Error:", err));
    return () => client.end();
  }, []);

  const SensorCard = ({ title, value, subtitle, color = "#333" }) => (
    <div style={{
      background: "#f8f8f8",
      padding: "1rem",
      borderRadius: "10px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      minWidth: "220px",
      flex: "1 1 250px",
      margin: "10px"
    }}>
      <h3 style={{ margin: 0, color: "#1e1e1e" }}>{title}</h3>
      <p style={{ fontSize: "24px", color, margin: "10px 0" }}><b>{value}</b></p>
      {subtitle && <p style={{ fontSize: "14px", color: "#666" }}>{subtitle}</p>}
    </div>
  );

  return (
    <div style={{ fontFamily: "Arial", padding: "20px", maxWidth: "1200px", margin: "auto", backgroundColor: "#1e1e1e", color: "#eee" }}>
      <h1 style={{ textAlign: "center" }}>🌡️ Monitor IoT - Sensores Ambientales</h1>
      <p style={{ textAlign: "center" }}>📡 Datos en tiempo real desde MQTT</p>

      {data.ubicacion && (
        <div style={{ height: "400px", margin: "20px 0", borderRadius: "10px", overflow: "hidden" }}>
          <MapContainer center={[data.ubicacion.lat, data.ubicacion.lon]} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[data.ubicacion.lat, data.ubicacion.lon]}>
              <Popup>📍 Ubicación estimada de la ESP32</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}

      <h2>🌐 Sensores Locales (ESP32)</h2>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
        <SensorCard title="🌡️ Temperatura (DHT22)" value={`${data.temp} °C`} subtitle="Sensor DHT22" />
        <SensorCard title="💧 Humedad (DHT22)" value={`${data.hum} %`} subtitle="Sensor DHT22" />
        <SensorCard title="🧪 O₂ crudo (ADC)" value={data.o2Raw} subtitle="Sensor Grove O₂" />
        <SensorCard title="🔵 Oxígeno estimado" value={`${data.o2Percent} %`} color="#27ae60" subtitle="Sensor Grove O₂ (0–25%)" />
        <SensorCard title="🔆 Luz cruda (ADC)" value={data.luxRaw} subtitle="Sensor TEMT6000" />
        <SensorCard title="🌞 Lux estimado" value={`${data.luxEst} lux`} color="#2980b9" subtitle="Sensor TEMT6000" />
        <SensorCard title="🌤️ UV crudo (ADC)" value={data.uvRaw} subtitle="Sensor UV Waveshare" />
        <SensorCard title="☀️ UV estimado" value={`${data.uvPower} µW/cm²`} color="#8e44ad" subtitle="Waveshare UV (200–370 nm)" />
        <SensorCard title="🎤 Sonido crudo (ADC)" value={data.soundRaw} subtitle="Sensor KY-037" />
        <SensorCard title="🔊 Nivel de sonido" value={`${data.soundDB} dB`} color="#2c3e50" subtitle="Sensor KY-037 (no calibrado)" />
      </div>

      <h2>🔗 Sensores Externos (Arduino)</h2>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
        <SensorCard title="🌿 CO₂ (SCD41)" value={`${data.scdCo2} ppm`} color="#16a085" subtitle="Sensor SCD41" />
        <SensorCard title="🌡️ Temp SCD41" value={`${data.scdTemp} °C`} subtitle="Sensor SCD41" />
        <SensorCard title="💧 Hum SCD41" value={`${data.scdHum} %`} subtitle="Sensor SCD41" />
        <SensorCard title="🧪 CO" value={`${data.co} ppm`} subtitle="Multichannel Gas Sensor" />
        <SensorCard title="🧪 NO₂" value={`${data.no2} ppm`} subtitle="Multichannel Gas Sensor" />
        <SensorCard title="🧪 Etanol" value={`${data.etanol} ppm`} subtitle="Multichannel Gas Sensor" />
        <SensorCard title="🧪 NH₃" value={`${data.nh3} ppm`} subtitle="Multichannel Gas Sensor" />
        <SensorCard title="🧪 CH₄" value={`${data.ch4} ppm`} subtitle="Multichannel Gas Sensor" />
        <SensorCard title="🌡️ Temp BMP280" value={`${data.bmpTemp} °C`} subtitle="Sensor BMP280" />
        <SensorCard title="🔵 Presión BMP280" value={`${data.bmpPresion} hPa`} subtitle="Sensor BMP280" />
      </div>
    </div>
  );
}

export default App;
