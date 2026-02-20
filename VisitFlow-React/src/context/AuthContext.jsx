import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    auth, db, doc, getDoc, onAuthStateChanged,
    setDoc, collection, query, limit, getDocs, addDoc, serverTimestamp
} from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [companyData, setCompanyData] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Safety timeout - if loading takes more than 10 seconds, show the app anyway
        const timeout = setTimeout(() => {
            console.warn('Auth initialization timeout - proceeding anyway');
            setLoading(false);
        }, 10000);

        let unsubscribe;

        try {
            unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                try {
                    if (currentUser) {
                        console.log('User authenticated:', currentUser.email);
                        try {
                            const userDocRef = doc(db, 'users', currentUser.uid);
                            const userDoc = await getDoc(userDocRef);

                            if (userDoc.exists()) {
                                const data = userDoc.data();
                                console.log('User data loaded:', data);
                                setUserData(data);
                                setRole(data.role || 'recepcion');
                                setCompanyId(data.companyId || null);

                                if (data.companyId) {
                                    try {
                                        const compDoc = await getDoc(doc(db, 'organizations', data.companyId));
                                        if (compDoc.exists()) {
                                            setCompanyData(compDoc.data());
                                            console.log('Company data loaded:', compDoc.data());
                                        }
                                    } catch (compError) {
                                        console.error("Error fetching company data:", compError);
                                    }
                                }
                            } else {
                                console.log('No user document found. Attempting to auto-register user...');
                                try {
                                    // 1. Find existing organization or create one
                                    const orgQuery = query(collection(db, 'organizations'), limit(1));
                                    const orgSnapshot = await getDocs(orgQuery);

                                    let firstOrgId = null;
                                    if (!orgSnapshot.empty) {
                                        firstOrgId = orgSnapshot.docs[0].id;
                                        console.log('Found organization to bind user to:', firstOrgId);
                                    } else {
                                        // Create default org if not exists (fallback)
                                        console.log('No organization found. Creating default...');
                                        const newOrgRef = await addDoc(collection(db, 'organizations'), {
                                            name: 'Mi Empresa',
                                            createdAt: serverTimestamp()
                                        });
                                        firstOrgId = newOrgRef.id;
                                        console.log('Created new default organization:', firstOrgId);
                                    }

                                    // 2. Create user document with admin role
                                    await setDoc(userDocRef, {
                                        email: currentUser.email,
                                        role: 'administrador', // Give admin access by default for DX
                                        companyId: firstOrgId,
                                        createdAt: serverTimestamp()
                                    });

                                    console.log('✅ User auto-registered successfully');

                                    // 3. Update local state immediately
                                    setRole('administrador');
                                    setCompanyId(firstOrgId);

                                    // 4. Fetch company data
                                    if (firstOrgId) {
                                        const compDoc = await getDoc(doc(db, 'organizations', firstOrgId));
                                        if (compDoc.exists()) setCompanyData(compDoc.data());
                                    }

                                } catch (regError) {
                                    console.error('Auto-registration failed:', regError);
                                    setRole('recepcion'); // Fallback
                                }
                            }
                        } catch (userError) {
                            console.error("Error fetching user data:", userError);
                            setRole('recepcion');
                        }
                        setUser(currentUser);
                    } else {
                        console.log('No user authenticated');
                        setUser(null);
                        setUserData(null);
                        setRole(null);
                        setCompanyId(null);
                        setCompanyData(null);
                    }
                } catch (innerError) {
                    console.error("Error in auth state change handler:", innerError);
                    setError(innerError.message);
                } finally {
                    clearTimeout(timeout);
                    setLoading(false);
                }
            });
        } catch (authError) {
            console.error("Error setting up auth listener:", authError);
            setError(authError.message);
            clearTimeout(timeout);
            setLoading(false);
        }

        return () => {
            clearTimeout(timeout);
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Always render children, even if loading (to prevent blank screen)
    return (
        <AuthContext.Provider value={{ user, userData, role, companyId, companyData, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
