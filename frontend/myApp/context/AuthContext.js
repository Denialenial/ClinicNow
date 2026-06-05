import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.role === "staff" && !userData.isVerified) {
            await signOut(auth);
            setUser(null);
            setUserRole(null);
            setLoading(false);
            return;
          }
          
          if (userData.isBanned) {
            await signOut(auth);
            setUser(null);
            setUserRole(null);
            setLoading(false);
            return;
          }
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: userData.name,
            phone: userData.phone,
            role: userData.role,
            clinicId: userData.clinicId || null,
            category: userData.category || null,
            serviceIds: userData.serviceIds || [],
            isVerified: userData.isVerified || false,
            isBanned: userData.isBanned || false,
            isOnDuty: userData.isOnDuty || false,
          });
          setUserRole(userData.role);
        } else {
          await signOut(auth);
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = (userData) => {
    setUser(userData);
    setUserRole(userData?.role);
  };

  const logout = async () => { 
    await signOut(auth); 
    setUser(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);