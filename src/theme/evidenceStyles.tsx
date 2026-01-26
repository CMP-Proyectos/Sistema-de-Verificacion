import { styles, evidenceStyles as es } from '../../../theme/styles'; 

return (
  <div style={styles.scrollable}>
      <div style={styles.card}>
          <div style={{...styles.flexBetween, ...styles.mb16}}>
               <h3 style={es.header}>1. Ubicación</h3>
               <span style={{...es.badge, ...(isOnline ? es.badgeOn : es.badgeOff)}}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
               </span>
          </div>

          <div style={es.switchBar}>
               <button style={{...es.switchBtn, ...(mode==='gps'? es.switchActive : {})}}>GPS</button>
               {/* ... */}
          </div>
          
          <div style={es.mapBox}>
               {/* ... */}
          </div>
      </div>
  </div>
)